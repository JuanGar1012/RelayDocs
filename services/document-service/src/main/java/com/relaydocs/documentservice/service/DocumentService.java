package com.relaydocs.documentservice.service;

import com.relaydocs.documentservice.api.dto.CreateDocumentRequest;
import com.relaydocs.documentservice.api.dto.DocumentResponse;
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
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher domainEventPublisher;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentPermissionRepository documentPermissionRepository,
            UserRepository userRepository,
            DomainEventPublisher domainEventPublisher
    ) {
        this.documentRepository = documentRepository;
        this.documentPermissionRepository = documentPermissionRepository;
        this.userRepository = userRepository;
        this.domainEventPublisher = domainEventPublisher;
    }

    @Transactional
    public List<DocumentResponse> listVisibleDocuments(String actorUserId) {
        return documentRepository.findVisibleDocuments(actorUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DocumentResponse createDocument(String actorUserId, CreateDocumentRequest request) {
        UserEntity owner = getOrCreateUser(actorUserId);
        DocumentEntity created = documentRepository.save(new DocumentEntity(owner, request.title(), request.content()));
        DocumentResponse response = toResponse(created);

        domainEventPublisher.publish(
                "document.created",
                String.valueOf(response.id()),
                Map.of(
                        "documentId", response.id(),
                        "ownerUserId", response.ownerUserId(),
                        "actorUserId", actorUserId
                )
        );

        return response;
    }

    @Transactional
    public DocumentResponse getDocument(Long id, String actorUserId) {
        DocumentEntity document = getDocumentOrThrow(id);

        if (!canRead(document, actorUserId)) {
            throw new ApiForbiddenException("Forbidden");
        }

        return toResponse(document);
    }

    @Transactional
    public DocumentResponse updateDocument(Long id, String actorUserId, UpdateDocumentRequest request) {
        if (!request.hasAtLeastOneField()) {
            throw new ApiBadRequestException("At least one field must be provided");
        }

        DocumentEntity document = getDocumentOrThrow(id);

        if (!canEdit(document, actorUserId)) {
            throw new ApiForbiddenException("Forbidden");
        }

        if (request.title() != null) {
            document.setTitle(request.title());
        }

        if (request.content() != null) {
            document.setContent(request.content());
        }

        DocumentResponse response = toResponse(documentRepository.save(document));

        domainEventPublisher.publish(
                "document.updated",
                String.valueOf(response.id()),
                Map.of(
                        "documentId", response.id(),
                        "actorUserId", actorUserId
                )
        );

        return response;
    }

    @Transactional
    public DocumentResponse shareDocument(Long id, String actorUserId, ShareDocumentRequest request) {
        DocumentEntity document = getDocumentOrThrow(id);

        if (!document.getOwner().getId().equals(actorUserId)) {
            throw new ApiForbiddenException("Forbidden");
        }
        if (actorUserId.equals(request.userId())) {
            throw new ApiBadRequestException("Owner already has full access");
        }

        UserEntity targetUser = getOrCreateUser(request.userId());
        Optional<DocumentPermissionEntity> existingPermission = documentPermissionRepository.findByDocumentIdAndUserId(
                id,
                request.userId()
        );

        if (existingPermission.isPresent()) {
            DocumentPermissionEntity permissionEntity = existingPermission.get();
            permissionEntity.setRole(request.role());
            documentPermissionRepository.save(permissionEntity);
        } else {
            DocumentPermissionEntity permissionEntity = new DocumentPermissionEntity(document, targetUser, request.role());
            documentPermissionRepository.save(permissionEntity);
        }

        DocumentResponse response = toResponse(getDocumentOrThrow(id));

        domainEventPublisher.publish(
                "document.shared",
                String.valueOf(response.id()),
                Map.of(
                        "documentId", response.id(),
                        "actorUserId", actorUserId,
                        "targetUserId", request.userId(),
                        "role", request.role().name().toLowerCase(Locale.ROOT)
                )
        );

        domainEventPublisher.publish(
                "permission.changed",
                String.valueOf(response.id()),
                Map.of(
                        "documentId", response.id(),
                        "actorUserId", actorUserId,
                        "targetUserId", request.userId(),
                        "role", request.role().name().toLowerCase(Locale.ROOT)
                )
        );

        return response;
    }

    private DocumentEntity getDocumentOrThrow(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ApiNotFoundException("Document not found"));
    }

    private UserEntity getOrCreateUser(String userId) {
        return userRepository.findById(userId)
                .orElseGet(() -> userRepository.save(new UserEntity(userId, userId + "@relaydocs.local")));
    }

    private boolean canRead(DocumentEntity document, String actorUserId) {
        return document.getOwner().getId().equals(actorUserId)
                || document.getPermissions().stream().anyMatch((permission) -> permission.getUser().getId().equals(actorUserId));
    }

    private boolean canEdit(DocumentEntity document, String actorUserId) {
        if (document.getOwner().getId().equals(actorUserId)) {
            return true;
        }

        return document.getPermissions().stream().anyMatch((permission) ->
                permission.getUser().getId().equals(actorUserId)
                        && permission.getRole() == PermissionRole.EDITOR
        );
    }

    private DocumentResponse toResponse(DocumentEntity document) {
        Map<String, String> sharedWith = new LinkedHashMap<>();
        document.getPermissions().stream()
                .sorted((left, right) -> left.getUser().getId().compareTo(right.getUser().getId()))
                .forEach((permission) -> sharedWith.put(
                        permission.getUser().getId(),
                        permission.getRole().name().toLowerCase(Locale.ROOT)
                ));

        return new DocumentResponse(
                document.getId(),
                document.getOwner().getId(),
                document.getTitle(),
                document.getContent(),
                sharedWith,
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }
}
