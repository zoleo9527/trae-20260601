package com.hrstaffing.service;

import com.hrstaffing.common.auth.UserContext;
import com.hrstaffing.common.exception.BizException;
import com.hrstaffing.entity.Attachment;
import com.hrstaffing.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepo;

    @Value("${file.upload-dir:/tmp/hrstaffing-uploads}")
    private String uploadDir;

    @Transactional
    public Attachment upload(MultipartFile file, String bizType, Long bizId, String remark) {
        if (file == null || file.isEmpty()) {
            throw new BizException("文件不能为空");
        }
        ensureDir();
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path sub = Paths.get(uploadDir, dateDir);
        try {
            Files.createDirectories(sub);
        } catch (IOException e) {
            throw new BizException("创建上传目录失败");
        }
        String stored = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = sub.resolve(stored);
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BizException("文件保存失败");
        }
        UserContext.CurrentUser user = UserContext.getCurrent();
        Attachment a = new Attachment();
        a.setOriginalFileName(original != null ? original : "unnamed");
        a.setStoredFileName(stored);
        a.setFilePath(target.toString());
        a.setFileSize(file.getSize());
        a.setContentType(file.getContentType());
        a.setBizType(bizType);
        a.setBizId(bizId);
        a.setRemark(remark);
        a.setUploadedBy(user.getUserId());
        a.setUploadedByName(user.getUserName());
        return attachmentRepo.save(a);
    }

    public ResponseEntity<Resource> download(Long id) {
        Attachment a = attachmentRepo.findById(id)
                .orElseThrow(() -> new BizException("附件不存在"));
        File f = new File(a.getFilePath());
        if (!f.exists()) {
            throw new BizException("文件已丢失");
        }
        Resource resource = new FileSystemResource(f);
        String encoded;
        try {
            encoded = URLEncoder.encode(a.getOriginalFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        } catch (Exception e) {
            encoded = "attachment";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        a.getContentType() != null ? a.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encoded + "\"; filename*=UTF-8''" + encoded)
                .body(resource);
    }

    public List<Attachment> listByBiz(String bizType, Long bizId) {
        return attachmentRepo.findByBizTypeAndBizIdOrderByCreatedAtDesc(bizType, bizId);
    }

    @Transactional
    public void delete(Long id) {
        Attachment a = attachmentRepo.findById(id)
                .orElseThrow(() -> new BizException("附件不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (!a.getUploadedBy().equals(user.getUserId())) {
            throw new BizException("仅上传者可删除此附件");
        }
        try {
            Files.deleteIfExists(Paths.get(a.getFilePath()));
        } catch (IOException ignored) {
        }
        attachmentRepo.delete(a);
    }

    private void ensureDir() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new BizException("初始化上传目录失败");
        }
    }
}
