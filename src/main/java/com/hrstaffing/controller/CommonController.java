package com.hrstaffing.controller;

import com.hrstaffing.common.R;
import com.hrstaffing.common.auth.RequireRole;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/common")
@RequiredArgsConstructor
@RequireRole({Role.RECRUITER, Role.SUPERVISOR, Role.ACCOUNTANT})
public class CommonController {

    private final AttachmentService attachmentService;

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        return attachmentService.download(id);
    }

    @GetMapping("/health")
    public R<String> health() {
        return R.ok("人力派遣考勤排班与异常确认系统运行正常");
    }
}
