package com.relaydocs.documentservice.api;

import com.relaydocs.documentservice.api.dto.CreateDocumentRequest;
import com.relaydocs.documentservice.api.dto.ListDocumentsApiResponse;
import com.relaydocs.documentservice.api.dto.ShareDocumentRequest;
import com.relaydocs.documentservice.api.dto.SingleDocumentApiResponse;
import com.relaydocs.documentservice.api.dto.UpdateDocumentRequest;
import com.relaydocs.documentservice.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private static final String USER_HEADER = "X-User-Id";

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<ListDocumentsApiResponse> listDocuments(@RequestHeader(USER_HEADER) String actorUserId) {
        return ResponseEntity.ok(new ListDocumentsApiResponse(documentService.listVisibleDocuments(actorUserId)));
    }

    @PostMapping
    public ResponseEntity<SingleDocumentApiResponse> createDocument(
            @RequestHeader(USER_HEADER) String actorUserId,
            @RequestBody @Valid CreateDocumentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SingleDocumentApiResponse(documentService.createDocument(actorUserId, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SingleDocumentApiResponse> getDocument(
            @RequestHeader(USER_HEADER) String actorUserId,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(new SingleDocumentApiResponse(documentService.getDocument(id, actorUserId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SingleDocumentApiResponse> updateDocument(
            @RequestHeader(USER_HEADER) String actorUserId,
            @PathVariable Long id,
            @RequestBody @Valid UpdateDocumentRequest request
    ) {
        return ResponseEntity.ok(new SingleDocumentApiResponse(documentService.updateDocument(id, actorUserId, request)));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<SingleDocumentApiResponse> shareDocument(
            @RequestHeader(USER_HEADER) String actorUserId,
            @PathVariable Long id,
            @RequestBody @Valid ShareDocumentRequest request
    ) {
        return ResponseEntity.ok(new SingleDocumentApiResponse(documentService.shareDocument(id, actorUserId, request)));
    }
}