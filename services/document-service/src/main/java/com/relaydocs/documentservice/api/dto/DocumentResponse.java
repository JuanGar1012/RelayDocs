package com.relaydocs.documentservice.api.dto;

import java.time.Instant;
import java.util.Map;

public record DocumentResponse(
        Long id,
        String ownerUserId,
        String title,
        String content,
        Map<String, String> sharedWith,
        Instant createdAt,
        Instant updatedAt
) {
}