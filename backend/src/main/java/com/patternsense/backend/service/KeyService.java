package com.patternsense.backend.service;

import com.patternsense.backend.entity.UserKey;
import com.patternsense.backend.repository.UserKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeyService {

    private final UserKeyRepository userKeyRepository;

    @Value("${ENCRYPTION_KEY}")
    private String encryptionKeyHex;

    private void validateKey(String apiKey, String provider) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request;
        if ("groq".equals(provider)) {
            request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/models"))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
        } else {
            request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey))
                    .GET()
                    .build();
        }
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        if (status == 200) return;
        String providerName = "groq".equals(provider) ? "Groq" : "Gemini";
        // 429 = quota exhausted — key is valid, just rate-limited; don't treat as bad key
        if (status == 429) {
            throw new RuntimeException(providerName + " API quota exhausted — wait for reset or switch providers");
        }
        // 401/403/other = truly invalid key
        throw new IllegalArgumentException("Invalid " + providerName + " API key — please check and try again");
    }

    public void saveKey(UUID userId, String rawApiKey, String provider) throws Exception {
        String safeProvider = Set.of("gemini", "groq").contains(provider) ? provider : "gemini";
        validateKey(rawApiKey, safeProvider);
        byte[] keyBytes = HexFormat.of().parseHex(encryptionKeyHex);
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new IvParameterSpec(iv));
        byte[] encrypted = cipher.doFinal(rawApiKey.getBytes("UTF-8"));

        HexFormat hex = HexFormat.of();
        UserKey userKey = userKeyRepository.findByUserId(userId).orElse(new UserKey());
        userKey.setUserId(userId);
        userKey.setEncryptedKey(hex.formatHex(encrypted));
        userKey.setIv(hex.formatHex(iv));
        userKey.setProvider(safeProvider);
        userKey.setCreatedAt(OffsetDateTime.now());
        userKeyRepository.save(userKey);
    }

    public String getProvider(UUID userId) {
        return userKeyRepository.findByUserId(userId)
                .map(UserKey::getProvider)
                .orElse("gemini");
    }

    public String decryptKey(UUID userId) throws Exception {
        UserKey userKey = userKeyRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No API key found for user"));

        byte[] keyBytes = HexFormat.of().parseHex(encryptionKeyHex);
        byte[] iv = HexFormat.of().parseHex(userKey.getIv());
        byte[] encrypted = HexFormat.of().parseHex(userKey.getEncryptedKey());

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new IvParameterSpec(iv));
        return new String(cipher.doFinal(encrypted), "UTF-8");
    }

    public void removeKey(UUID userId) {
        userKeyRepository.findByUserId(userId).ifPresent(userKeyRepository::delete);
    }

    public boolean hasKey(UUID userId) {
        return userKeyRepository.findByUserId(userId).isPresent();
    }

    public Map<String, String> getKeyInfo(UUID userId) throws Exception {
        UserKey userKey = userKeyRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No API key found"));
        String raw = decryptKey(userId);
        String masked = raw.length() > 8
                ? raw.substring(0, 4) + "••••••••" + raw.substring(raw.length() - 4)
                : "••••••••••••";
        return Map.of("provider", userKey.getProvider(), "maskedKey", masked);
    }

    public boolean validateStoredKey(UUID userId) {
        try {
            String rawKey = decryptKey(userId);
            String provider = getProvider(userId);
            validateKey(rawKey, provider);
            return true;
        } catch (IllegalArgumentException e) {
            removeKey(userId);
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
