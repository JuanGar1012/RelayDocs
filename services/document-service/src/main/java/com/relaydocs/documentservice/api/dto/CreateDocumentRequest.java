package com.relaydocs.documentservice.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 100000) String content
) {
}