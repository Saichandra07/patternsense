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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeyService {

    private final UserKeyRepository userKeyRepository;

    @Value("${ENCRYPTION_KEY}")
    private String encryptionKeyHex;

    private void validateGeminiKey(String apiKey) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey))
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalArgumentException("Invalid Gemini API key — please check and try again");
        }
    }

    public void saveKey(UUID userId, String rawApiKey) throws Exception {
        validateGeminiKey(rawApiKey);
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
        userKey.setCreatedAt(OffsetDateTime.now());
        userKeyRepository.save(userKey);
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

    public boolean validateStoredKey(UUID userId) {
        try {
            String rawKey = decryptKey(userId);
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + rawKey))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                removeKey(userId);
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
