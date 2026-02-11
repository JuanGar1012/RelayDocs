package com.relaydocs.documentservice.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateDocumentRequest(
        @Size(max = 255) String title,
        @Size(max = 100000) String content
) {
    public boolean hasAtLeastOneField() {
        return title != null || content != null;
    }
}