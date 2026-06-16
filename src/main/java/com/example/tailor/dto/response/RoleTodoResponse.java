package com.example.tailor.dto.response;

import java.util.List;

public class RoleTodoResponse {

    private String role;
    private List<TodoTaskDTO> feedbackTasks;
    private List<TodoTaskDTO> modificationTasks;

    public RoleTodoResponse() {}

    public RoleTodoResponse(String role, List<TodoTaskDTO> feedbackTasks, List<TodoTaskDTO> modificationTasks) {
        this.role = role;
        this.feedbackTasks = feedbackTasks;
        this.modificationTasks = modificationTasks;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public List<TodoTaskDTO> getFeedbackTasks() { return feedbackTasks; }
    public void setFeedbackTasks(List<TodoTaskDTO> feedbackTasks) { this.feedbackTasks = feedbackTasks; }
    public List<TodoTaskDTO> getModificationTasks() { return modificationTasks; }
    public void setModificationTasks(List<TodoTaskDTO> modificationTasks) { this.modificationTasks = modificationTasks; }
}