package com.hrstaffing.common.auth;

import com.hrstaffing.common.exception.BizException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class RoleAspect {

    @Around("@within(com.hrstaffing.common.auth.RequireRole) || @annotation(com.hrstaffing.common.auth.RequireRole)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        RequireRole ann = AnnotationUtils.findAnnotation(signature.getMethod(), RequireRole.class);
        if (ann == null) {
            ann = AnnotationUtils.findAnnotation(signature.getDeclaringType(), RequireRole.class);
        }
        if (ann != null) {
            Role current = UserContext.getCurrent().getRole();
            boolean allowed = Arrays.asList(ann.value()).contains(current);
            if (!allowed) {
                throw new BizException(403, "当前角色 [" + current.getLabel() + "] 无权访问该接口");
            }
        }
        return pjp.proceed();
    }
}
