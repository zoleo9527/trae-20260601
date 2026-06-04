package com.medical.aesthetic.context;

import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.enums.RoleType;

public class UserContext {

    private static final ThreadLocal<String> currentUsername = new ThreadLocal<>();
    private static final ThreadLocal<Employee> currentEmployee = new ThreadLocal<>();

    public static void setCurrentUser(Employee employee) {
        currentUsername.set(employee.getUsername());
        currentEmployee.set(employee);
    }

    public static String getCurrentUsername() {
        return currentUsername.get();
    }

    public static Employee getCurrentEmployee() {
        return currentEmployee.get();
    }

    public static RoleType getCurrentRole() {
        Employee employee = currentEmployee.get();
        return employee != null ? employee.getRole() : null;
    }

    public static void clear() {
        currentUsername.remove();
        currentEmployee.remove();
    }

    public static boolean hasRole(RoleType roleType) {
        RoleType currentRole = getCurrentRole();
        return currentRole == roleType;
    }
}
