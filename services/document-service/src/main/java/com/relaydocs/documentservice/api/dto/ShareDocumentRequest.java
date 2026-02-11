package com.relaydocs.documentservice.api.dto;

import com.relaydocs.documentservice.domain.PermissionRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ShareDocumentRequest(
        @NotBlank String userId,
        @NotNull PermissionRole role
) {
}