package com.patternsense.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.patternsense.backend.entity.*;
import com.patternsense.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;
    private final MessageRepository messageRepository;
    private final ProblemRepository problemRepository;
    private final SessionGapRepository sessionGapRepository;
    private final WeaknessMapRepository weaknessMapRepository;
    private final KeyService keyService;
    private final LeetCodeService leetCodeService;
    private final GeminiService geminiService;
    private final GroqService groqService;
    private final PromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    private static final String INITIAL_STATE =
        "{\"phase\":1,\"phase1\":{\"comprehension_gaps\":[],\"confirmed_at_turn\":null}," +
        "\"phase2\":{\"user_approach\":\"\",\"user_reasoning\":\"\",\"approach_type\":null,\"active_tier\":1," +
        "\"tier1_turns\":0,\"stuck_count\":0,\"stuck_points\":[],\"used_stuck_button\":false," +
        "\"needed_explanation\":false,\"approach_confirmed\":false,\"confirmed_solved_at_turn\":null}," +
        "\"phase3\":{\"pattern_confirmed\":false,\"variance_understood\":false,\"gap_note\":null}}";

    private static final String PHASE1_OPENER =
        "Let's start by making sure you understand exactly what this problem is asking. " +
        "In your own words — what does the problem want you to return?";

    @Transactional
    public Map<String, Object> startSession(UUID userId, String problemUrl) throws Exception {
        String apiKey = keyService.decryptKey(userId);
        String provider = keyService.getProvider(userId);

        Problem problem;
        try {
            problem = leetCodeService.fetchAndCache(problemUrl);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // StrictMode or concurrent request already committed this slug — read the committed row.
            String slug = leetCodeService.extractSlug(problemUrl);
            problem = problemRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Race condition: problem not found after conflict: " + slug));
        }

        String desc = problem.getDescription();
        if (desc == null || desc.isBlank() || "PREMIUM_NO_DESCRIPTION".equals(desc)) {
            throw new IllegalArgumentException(
                "PREMIUM_PROBLEM: This is a LeetCode Premium problem — the description isn't accessible. " +
                "Copy the problem text from another site (GFG, NeetCode, etc.) and use 'Paste a Problem' instead.");
        }

        String problemBrief = sessionRepository
            .findFirstByProblemIdAndProblemBriefIsNotNull(problem.getId())
            .map(Session::getProblemBrief)
            .orElse(null);

        if (problemBrief == null) {
            problemBrief = llmAnalyze(problem.getTitle(), problem.getDescription(), apiKey, provider);
        }

        Session session = new Session();
        session.setUserId(userId);
        session.setProblemId(problem.getId());
        session.setProblemBrief(problemBrief);
        session.setSessionState(INITIAL_STATE);
        session.setStatus("active");
        session.setCreatedAt(OffsetDateTime.now());
        session = sessionRepository.save(session);

        Message opener = new Message();
        opener.setSessionId(session.getId());
        opener.setRole("assistant");
        opener.setContent(PHASE1_OPENER);
        opener.setTurnNumber(1);
        opener.setCreatedAt(OffsetDateTime.now());
        messageRepository.save(opener);

        List<String> signalKeywords = new ArrayList<>();
        try {
            JsonNode briefNode = objectMapper.readTree(problemBrief);
            if (briefNode.has("signal_keywords")) {
                briefNode.get("signal_keywords").forEach(n -> signalKeywords.add(n.asText()));
            }
        } catch (Exception ignored) {}

        Map<String, Object> problemMap = new HashMap<>();
        problemMap.put("slug", problem.getSlug());
        problemMap.put("title", problem.getTitle());
        problemMap.put("difficulty", problem.getDifficulty());
        problemMap.put("description", problem.getDescription());
        problemMap.put("topicTags", problem.getTopicTags() != null ? problem.getTopicTags() : new String[]{});

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("problem", problemMap);
        result.put("firstMessage", PHASE1_OPENER);
        result.put("sessionState", INITIAL_STATE);
        result.put("signalKeywords", signalKeywords);
        return result;
    }

    @Transactional
    @Transactional
    public Map<String, Object> startSessionFromText(UUID userId, String title, String text) throws Exception {
        String apiKey = keyService.decryptKey(userId);
        String provider = keyService.getProvider(userId);

        Problem problem = new Problem();
        problem.setSlug("custom-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
        problem.setTitle(title);
        problem.setDescription(text);
        problem.setSource("custom");
        problem.setCreatedAt(OffsetDateTime.now());
        problem = problemRepository.save(problem);

        String problemBrief = llmAnalyze(title, text, apiKey, provider);

        Session session = new Session();
        session.setUserId(userId);
        session.setProblemId(problem.getId());
        session.setProblemBrief(problemBrief);
        session.setSessionState(INITIAL_STATE);
        session.setStatus("active");
        session.setCreatedAt(OffsetDateTime.now());
        session = sessionRepository.save(session);

        Message opener = new Message();
        opener.setSessionId(session.getId());
        opener.setRole("assistant");
        opener.setContent(PHASE1_OPENER);
        opener.setTurnNumber(1);
        opener.setCreatedAt(OffsetDateTime.now());
        messageRepository.save(opener);

        List<String> signalKeywords = new ArrayList<>();
        try {
            JsonNode briefNode = objectMapper.readTree(problemBrief);
            if (briefNode.has("signal_keywords")) {
                briefNode.get("signal_keywords").forEach(n -> signalKeywords.add(n.asText()));
            }
        } catch (Exception ignored) {}

        Map<String, Object> problemMap = new HashMap<>();
        problemMap.put("slug", problem.getSlug());
        problemMap.put("title", problem.getTitle());
        problemMap.put("difficulty", "custom");
        problemMap.put("description", problem.getDescription());
        problemMap.put("topicTags", new String[]{});

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("problem", problemMap);
        result.put("firstMessage", PHASE1_OPENER);
        result.put("sessionState", INITIAL_STATE);
        result.put("signalKeywords", signalKeywords);
        return result;
    }

    @Transactional
    public Map<String, Object> sendMessage(UUID userId, UUID sessionId, String content) throws Exception {
        Session session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!"active".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not active");
        }

        String apiKey = keyService.decryptKey(userId);
        Problem problem = problemRepository.findById(session.getProblemId())
            .orElseThrow(() -> new IllegalStateException("Problem not found"));

        List<Message> allMessages = messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId);
        int nextTurn = allMessages.size() + 1;

        Message userMsg = new Message();
        userMsg.setSessionId(sessionId);
        userMsg.setRole("user");
        userMsg.setContent(content);
        userMsg.setTurnNumber(nextTurn);
        userMsg.setCreatedAt(OffsetDateTime.now());
        messageRepository.save(userMsg);

        List<Message> recent = allMessages.size() > 12
            ? allMessages.subList(allMessages.size() - 12, allMessages.size())
            : allMessages;

        JsonNode state = objectMapper.readTree(session.getSessionState());
        int phase = state.get("phase").asInt();

        String provider = keyService.getProvider(userId);
        List<WeaknessMap> weaknesses = weaknessMapRepository.findByUserId(userId);
        String weaknessContext = buildWeaknessContext(weaknesses);
        String prompt = buildPrompt(phase, problem, session.getProblemBrief(), state, recent, content, weaknessContext);
        String rawResponse = llmSend(prompt, apiKey, provider);
        log.info("Gemini raw response (phase {}): {}", phase, rawResponse);

        JsonNode response = objectMapper.readTree(rawResponse);
        String assistantMessage = response.path("message").asText("");
        if (assistantMessage.isBlank()) {
            log.error("Gemini response missing 'message' field. Raw: {}", rawResponse);
            throw new RuntimeException("Gemini returned an unexpected response format.");
        }
        JsonNode delta = response.has("state_delta") ? response.get("state_delta") : objectMapper.createObjectNode();

        ObjectNode newState = (ObjectNode) objectMapper.readTree(session.getSessionState());
        boolean transitioned = applyDelta(newState, delta);

        if (transitioned && phase < 3) {
            newState.put("phase", phase + 1);
        }

        String updatedState = objectMapper.writeValueAsString(newState);
        session.setSessionState(updatedState);

        boolean complete = false;
        if (phase == 3) {
            JsonNode p3 = newState.get("phase3");
            if (p3 != null && p3.path("pattern_confirmed").asBoolean() && p3.path("variance_understood").asBoolean()) {
                complete = true;
            }
        }

        if (complete) {
            session.setStatus("complete");
            session.setCompletedAt(OffsetDateTime.now());
        }
        sessionRepository.save(session);

        Message assistantMsg = new Message();
        assistantMsg.setSessionId(sessionId);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(assistantMessage);
        assistantMsg.setTurnNumber(nextTurn + 1);
        assistantMsg.setCreatedAt(OffsetDateTime.now());
        messageRepository.save(assistantMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("message", assistantMessage);
        result.put("sessionState", updatedState);
        result.put("complete", complete);
        return result;
    }

    @Transactional
    public Map<String, Object> endSession(UUID userId, UUID sessionId) throws Exception {
        Session session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.setStatus("complete");
        session.setCompletedAt(OffsetDateTime.now());
        sessionRepository.save(session);

        JsonNode state = objectMapper.readTree(session.getSessionState());
        Problem problem = problemRepository.findById(session.getProblemId()).orElseThrow();
        JsonNode brief = objectMapper.readTree(session.getProblemBrief());

        String corePattern = brief.path("core_pattern").asText("Unknown");
        String gapNote = state.path("phase3").path("gap_note").asText(null);
        if (gapNote != null && gapNote.isBlank()) gapNote = null;

        SessionGap gap = new SessionGap();
        gap.setSessionId(sessionId);
        gap.setUserId(userId);
        gap.setPattern(corePattern);
        gap.setGapNote(gapNote);
        gap.setCreatedAt(OffsetDateTime.now());
        sessionGapRepository.save(gap);

        boolean neededExplanation = state.path("phase2").path("needed_explanation").asBoolean(false);
        String approachType = state.path("phase2").path("approach_type").asText("");
        boolean usedTier2 = "incompatible".equals(approachType) || "none".equals(approachType);

        int confidenceDelta;
        if (neededExplanation) {
            confidenceDelta = -15;
        } else if (usedTier2) {
            confidenceDelta = 5;
        } else {
            confidenceDelta = 10;
        }

        Optional<WeaknessMap> existing = weaknessMapRepository.findByUserIdAndPattern(userId, corePattern);
        WeaknessMap wm = existing.orElse(new WeaknessMap());
        wm.setUserId(userId);
        wm.setPattern(corePattern);
        int newScore;
        if (existing.isEmpty()) {
            // First session on this pattern — they just learned it. Start neutral; delta applies on repeat sessions.
            newScore = 50;
        } else {
            int current = existing.get().getConfidenceScore();
            newScore = Math.max(0, Math.min(100, current + confidenceDelta));
        }
        wm.setConfidenceScore(newScore);
        wm.setLastUpdated(OffsetDateTime.now());
        weaknessMapRepository.save(wm);

        Map<String, Object> result = new HashMap<>();
        result.put("pattern", corePattern);
        result.put("confidenceDelta", confidenceDelta);
        result.put("newConfidenceScore", newScore);
        result.put("gapNote", gapNote);
        return result;
    }

    @Transactional
    public Map<String, Object> stuck(UUID userId, UUID sessionId) throws Exception {
        Session session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!"active".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not active");
        }

        String apiKey = keyService.decryptKey(userId);
        Problem problem = problemRepository.findById(session.getProblemId())
            .orElseThrow(() -> new IllegalStateException("Problem not found"));

        ObjectNode state = (ObjectNode) objectMapper.readTree(session.getSessionState());
        ObjectNode p2 = (ObjectNode) state.get("phase2");
        p2.put("used_stuck_button", true);
        p2.put("needed_explanation", true);
        int stuckCount = p2.path("stuck_count").asInt(0) + 1;
        p2.put("stuck_count", stuckCount);

        List<Message> allMessages = messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId);
        List<Message> recent = allMessages.size() > 12
            ? allMessages.subList(allMessages.size() - 12, allMessages.size())
            : allMessages;

        int phase = state.get("phase").asInt();
        String stuckProvider = keyService.getProvider(userId);
        List<WeaknessMap> stuckWeaknesses = weaknessMapRepository.findByUserId(userId);
        String stuckWeaknessContext = buildWeaknessContext(stuckWeaknesses);
        String prompt = buildPrompt(phase, problem, session.getProblemBrief(), state, recent,
            "[User clicked 'I'm stuck' — provide a more direct hint or explanation]", stuckWeaknessContext);

        String rawResponse = llmSend(prompt, apiKey, stuckProvider);
        JsonNode response = objectMapper.readTree(rawResponse);
        String assistantMessage = response.get("message").asText();

        String updatedState = objectMapper.writeValueAsString(state);
        session.setSessionState(updatedState);
        sessionRepository.save(session);

        int nextTurn = allMessages.size() + 1;
        Message assistantMsg = new Message();
        assistantMsg.setSessionId(sessionId);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(assistantMessage);
        assistantMsg.setTurnNumber(nextTurn);
        assistantMsg.setCreatedAt(OffsetDateTime.now());
        messageRepository.save(assistantMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("message", assistantMessage);
        result.put("sessionState", updatedState);
        return result;
    }

    private String buildPrompt(int phase, Problem problem, String problemBrief,
                               JsonNode state, List<Message> recent, String userMessage,
                               String weaknessContext) throws Exception {
        String stateStr = objectMapper.writeValueAsString(state);
        return switch (phase) {
            case 1 -> promptBuilder.phase1(problem.getTitle(), problem.getDescription(),
                problemBrief, stateStr, recent, userMessage);
            case 2 -> {
                JsonNode p2 = state.get("phase2");
                int stuckCount = p2.path("stuck_count").asInt(0);
                boolean hasApproach = !p2.path("user_approach").asText("").isEmpty();
                boolean hasReasoning = !p2.path("user_reasoning").asText("").isEmpty();
                yield promptBuilder.phase2(problem.getTitle(), problem.getDescription(),
                    problemBrief, stateStr, recent, userMessage, stuckCount, hasApproach, hasReasoning, weaknessContext);
            }
            case 3 -> {
                yield promptBuilder.phase3(problem.getTitle(), problemBrief, stateStr,
                    recent, userMessage, "self_directed");
            }
            default -> throw new IllegalStateException("Unknown phase: " + phase);
        };
    }

    private String llmAnalyze(String title, String desc, String apiKey, String provider) throws Exception {
        return "groq".equals(provider)
            ? groqService.analyzeProblem(title, desc, apiKey)
            : geminiService.analyzeProblem(title, desc, apiKey);
    }

    private String llmSend(String prompt, String apiKey, String provider) throws Exception {
        return "groq".equals(provider)
            ? groqService.sendMessage(prompt, apiKey)
            : geminiService.sendMessage(prompt, apiKey);
    }

    @Transactional
    public void deleteSession(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found or access denied"));
        sessionRepository.delete(session);
    }

    public List<Map<String, Object>> getRecentSessions(UUID userId) throws Exception {
        List<Session> sessions = sessionRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Session session : sessions) {
            Optional<Problem> problemOpt = problemRepository.findById(session.getProblemId());
            if (problemOpt.isEmpty()) continue;
            Problem problem = problemOpt.get();

            JsonNode state = objectMapper.readTree(session.getSessionState());
            int phase = state.path("phase").asInt(1);

            String pattern = null;
            if (session.getProblemBrief() != null) {
                try {
                    JsonNode brief = objectMapper.readTree(session.getProblemBrief());
                    pattern = brief.path("core_pattern").asText(null);
                    if (pattern != null && pattern.isBlank()) pattern = null;
                } catch (Exception ignored) {}
            }

            int messageCount = messageRepository.countBySessionId(session.getId());

            Map<String, Object> item = new HashMap<>();
            item.put("sessionId", session.getId());
            item.put("status", session.getStatus());
            item.put("phase", phase);
            item.put("problemSlug", problem.getSlug());
            item.put("problemTitle", problem.getTitle());
            item.put("difficulty", problem.getDifficulty());
            item.put("description", problem.getDescription());
            item.put("topicTags", problem.getTopicTags() != null ? problem.getTopicTags() : new String[]{});
            item.put("pattern", pattern);
            item.put("gapNote", null);
            item.put("completedAt", session.getCompletedAt());
            item.put("messageCount", messageCount);
            item.put("sessionState", session.getSessionState());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getSessionMessages(UUID userId, UUID sessionId) {
        sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found or access denied"));
        List<Message> messages = messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Message msg : messages) {
            Map<String, Object> item = new HashMap<>();
            item.put("role", msg.getRole());
            item.put("content", msg.getContent());
            result.add(item);
        }
        return result;
    }

    private String buildWeaknessContext(List<WeaknessMap> weaknesses) {
        if (weaknesses.isEmpty()) return "(no patterns practiced yet)";
        StringBuilder sb = new StringBuilder();
        for (WeaknessMap w : weaknesses) {
            sb.append(w.getPattern()).append(": ").append(w.getConfidenceScore()).append("/100 | ");
        }
        String s = sb.toString();
        return s.endsWith(" | ") ? s.substring(0, s.length() - 3) : s;
    }

    /**
     * Applies validated state_delta from LLM. Returns true if phase_transition was set.
     * Rejects the entire delta if any unknown field is present (whitelist enforcement).
     */
    private boolean applyDelta(ObjectNode state, JsonNode delta) {
        if (delta == null || delta.isNull() || !delta.isObject() || delta.isEmpty()) return false;

        // "phase" is ignored if Gemini includes it — phase is always incremented by backend via phase_transition
        Set<String> topLevel = Set.of("phase_transition", "phase1", "phase2", "phase3", "phase");
        delta.fieldNames().forEachRemaining(f -> {
            if (!topLevel.contains(f))
                throw new IllegalArgumentException("Rejected state_delta: unknown field '" + f + "'");
        });
        if (delta.has("phase")) {
            log.warn("Gemini tried to set phase directly in state_delta — ignored. Value was: {}", delta.get("phase"));
        }

        boolean transition = delta.path("phase_transition").asBoolean(false);

        if (delta.has("phase1")) {
            JsonNode d = delta.get("phase1");
            ObjectNode p1 = (ObjectNode) state.get("phase1");
            Set<String> allowed = Set.of("confirmed_at_turn", "comprehension_gaps");
            d.fieldNames().forEachRemaining(f -> {
                if (!allowed.contains(f)) throw new IllegalArgumentException("Rejected phase1 field: " + f);
            });
            if (d.has("confirmed_at_turn")) p1.set("confirmed_at_turn", d.get("confirmed_at_turn"));
            if (d.has("comprehension_gaps")) p1.set("comprehension_gaps", d.get("comprehension_gaps"));
        }

        if (delta.has("phase2")) {
            JsonNode d = delta.get("phase2");
            ObjectNode p2 = (ObjectNode) state.get("phase2");
            Set<String> allowed = Set.of("user_approach", "user_reasoning", "approach_type", "active_tier",
                "tier1_turns", "stuck_points", "used_stuck_button",
                "needed_explanation", "approach_confirmed", "confirmed_solved_at_turn");
            d.fieldNames().forEachRemaining(f -> {
                if (!allowed.contains(f)) throw new IllegalArgumentException("Rejected phase2 field: " + f);
            });

            if (d.has("user_approach")) p2.set("user_approach", d.get("user_approach"));
            if (d.has("user_reasoning")) p2.set("user_reasoning", d.get("user_reasoning"));

            if (d.has("approach_type")) {
                String val = d.get("approach_type").asText();
                if (Set.of("refinable", "incompatible", "none").contains(val)) {
                    p2.put("approach_type", val);
                } else {
                    log.warn("Invalid approach_type '{}' — ignoring", val);
                }
            }

            if (d.has("active_tier")) p2.set("active_tier", d.get("active_tier"));

            if (d.has("tier1_turns")) {
                int current = p2.path("tier1_turns").asInt(0);
                int proposed = d.get("tier1_turns").asInt(0);
                if (proposed >= current) p2.put("tier1_turns", proposed);
            }

            // stuck_count is write-only via the stuck() endpoint — LLM cannot modify it

            if (d.has("stuck_points")) p2.set("stuck_points", d.get("stuck_points"));

            if (d.has("used_stuck_button") && d.get("used_stuck_button").asBoolean())
                p2.put("used_stuck_button", true);
            if (d.has("needed_explanation") && d.get("needed_explanation").asBoolean())
                p2.put("needed_explanation", true);
            if (d.has("approach_confirmed") && d.get("approach_confirmed").asBoolean())
                p2.put("approach_confirmed", true);

            if (d.has("confirmed_solved_at_turn"))
                p2.set("confirmed_solved_at_turn", d.get("confirmed_solved_at_turn"));
        }

        if (delta.has("phase3")) {
            JsonNode d = delta.get("phase3");
            ObjectNode p3 = (ObjectNode) state.get("phase3");
            Set<String> allowed = Set.of("pattern_confirmed", "variance_understood", "gap_note");
            d.fieldNames().forEachRemaining(f -> {
                if (!allowed.contains(f)) throw new IllegalArgumentException("Rejected phase3 field: " + f);
            });
            if (d.has("pattern_confirmed")) p3.set("pattern_confirmed", d.get("pattern_confirmed"));
            if (d.has("variance_understood")) p3.set("variance_understood", d.get("variance_understood"));
            if (d.has("gap_note")) p3.set("gap_note", d.get("gap_note"));
        }

        return transition;
    }
}
