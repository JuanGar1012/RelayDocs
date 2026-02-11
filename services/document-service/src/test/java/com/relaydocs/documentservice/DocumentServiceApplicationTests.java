package com.relaydocs.documentservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointReturnsOk() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("document-service"))
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void documentCrudAndSharingFlow() throws Exception {
        String createResponse = mockMvc.perform(post("/api/v1/documents")
                        .header("X-User-Id", "owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Doc One",
                                  "content": "Body One"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.document.ownerUserId").value("owner"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String documentId = createResponse.replaceAll(".*\\\"id\\\":(\\d+).*", "$1");

        mockMvc.perform(get("/api/v1/documents/{id}", documentId)
                        .header("X-User-Id", "outsider"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/documents/{id}/share", documentId)
                        .header("X-User-Id", "owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "viewer-user",
                                  "role": "viewer"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.sharedWith.viewer-user").value("viewer"));

        mockMvc.perform(get("/api/v1/documents/{id}", documentId)
                        .header("X-User-Id", "viewer-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.id").value(Integer.parseInt(documentId)));

        mockMvc.perform(patch("/api/v1/documents/{id}", documentId)
                        .header("X-User-Id", "viewer-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Updated by viewer"
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/documents/{id}", documentId)
                        .header("X-User-Id", "owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Updated by owner"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.content").value("Updated by owner"));
    }
}