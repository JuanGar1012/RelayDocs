package com.relaydocs.documentservice.api.dto;

import java.util.List;

public record ListDocumentsApiResponse(List<DocumentResponse> documents) {
}