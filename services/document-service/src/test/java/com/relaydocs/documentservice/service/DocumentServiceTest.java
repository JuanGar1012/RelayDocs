package com.relaydocs.documentservice.service;

import com.relaydocs.documentservice.api.dto.ShareDocumentRequest;
import com.relaydocs.documentservice.api.dto.UpdateDocumentRequest;
import com.relaydocs.documentservice.domain.PermissionRole;
import com.relaydocs.documentservice.events.DomainEventPublisher;
import com.relaydocs.documentservice.persistence.DocumentEntity;
import com.relaydocs.documentservice.persistence.DocumentPermissionEntity;
import com.relaydocs.documentservice.persistence.DocumentPermissionRepository;
import com.relaydocs.documentservice.persistence.DocumentRepository;
import com.relaydocs.documentservice.persistence.UserEntity;
import com.relaydocs.documentservice.persistence.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentPermissionRepository documentPermissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DomainEventPublisher domainEventPublisher;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void updateDocumentRejectsViewerRole() {
        DocumentEntity document = createDocumentWithId(42L, "owner-user", "Title", "Original");
        addPermission(document, "viewer-user", PermissionRole.VIEWER);
        when(documentRepository.findById(42L)).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.updateDocument(
                42L,
                "viewer-user",
                new UpdateDocumentRequest(null, "Updated")
        )).isInstanceOf(ApiForbiddenException.class).hasMessage("Forbidden");

        verify(documentRepository, never()).save(any(DocumentEntity.class));
        verify(domainEventPublisher, never()).publish(any(), any(), any());
    }

    @Test
    void updateDocumentAllowsEditorRole() {
        DocumentEntity document = createDocumentWithId(42L, "owner-user", "Title", "Original");
        addPermission(document, "editor-user", PermissionRole.EDITOR);
        when(documentRepository.findById(42L)).thenReturn(Optional.of(document));
        when(documentRepository.save(any(DocumentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = documentService.updateDocument(42L, "editor-user", new UpdateDocumentRequest("Next title", null));

        assertThat(response.title()).isEqualTo("Next title");
        assertThat(response.content()).isEqualTo("Original");
        verify(domainEventPublisher).publish(eq("document.updated"), eq("42"), any());
    }

    @Test
    void shareDocumentUpdatesExistingPermissionRole() {
        DocumentEntity document = createDocumentWithId(7L, "owner-user", "Title", "Body");
        UserEntity targetUser = new UserEntity("target-user", "target-user@relaydocs.local");
        DocumentPermissionEntity existingPermission = new DocumentPermissionEntity(document, targetUser, PermissionRole.VIEWER);
        document.getPermissions().add(existingPermission);
        when(documentRepository.findById(7L)).thenReturn(Optional.of(document));
        when(documentPermissionRepository.findByDocumentIdAndUserId(7L, "target-user"))
                .thenReturn(Optional.of(existingPermission));

        var response = documentService.shareDocument(
                7L,
                "owner-user",
                new ShareDocumentRequest("target-user", PermissionRole.EDITOR)
        );

        assertThat(existingPermission.getRole()).isEqualTo(PermissionRole.EDITOR);
        assertThat(response.sharedWith()).containsEntry("target-user", "editor");
        verify(documentPermissionRepository).save(existingPermission);
        verify(domainEventPublisher, times(2)).publish(any(), eq("7"), any());
    }

    @Test
    void shareDocumentRejectsNonOwner() {
        DocumentEntity document = createDocumentWithId(9L, "owner-user", "Title", "Body");
        when(documentRepository.findById(9L)).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.shareDocument(
                9L,
                "not-owner",
                new ShareDocumentRequest("target-user", PermissionRole.VIEWER)
        )).isInstanceOf(ApiForbiddenException.class).hasMessage("Forbidden");

        verify(documentPermissionRepository, never()).save(any(DocumentPermissionEntity.class));
        verify(domainEventPublisher, never()).publish(any(), any(), any());
    }

    @Test
    void updateDocumentUsesLastWriteStateForSequentialConcurrentRequests() {
        DocumentEntity document = createDocumentWithId(55L, "owner-user", "Title", "Initial");
        when(documentRepository.findById(55L)).thenReturn(Optional.of(document));
        when(documentRepository.save(any(DocumentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        documentService.updateDocument(55L, "owner-user", new UpdateDocumentRequest(null, "First write"));
        var finalResponse = documentService.updateDocument(55L, "owner-user", new UpdateDocumentRequest(null, "Second write"));

        assertThat(document.getContent()).isEqualTo("Second write");
        assertThat(finalResponse.content()).isEqualTo("Second write");
        verify(domainEventPublisher, times(2)).publish(eq("document.updated"), eq("55"), any());
        verify(domainEventPublisher, times(2)).publish(
                eq("document.updated"),
                eq("55"),
                argThat((payload) -> "owner-user".equals(payload.get("actorUserId")) && Long.valueOf(55L).equals(payload.get("documentId")))
        );
    }

    private static DocumentEntity createDocumentWithId(Long id, String ownerUserId, String title, String content) {
        UserEntity owner = new UserEntity(ownerUserId, ownerUserId + "@relaydocs.local");
        DocumentEntity document = new DocumentEntity(owner, title, content);
        ReflectionTestUtils.setField(document, "id", id);
        ReflectionTestUtils.setField(document, "createdAt", Instant.parse("2026-02-12T00:00:00Z"));
        ReflectionTestUtils.setField(document, "updatedAt", Instant.parse("2026-02-12T00:00:00Z"));
        return document;
    }

    private static void addPermission(DocumentEntity document, String userId, PermissionRole role) {
        UserEntity user = new UserEntity(userId, userId + "@relaydocs.local");
        DocumentPermissionEntity permission = new DocumentPermissionEntity(document, user, role);
        document.getPermissions().add(permission);
    }
}
