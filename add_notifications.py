import re

# 修改 complaint.go - 在 CreateComplaint 中添加通知创建
with open('internal/store/complaint.go', 'r') as f:
    content = f.read()

# 在 CreateComplaint 的 return 前添加通知创建
old_create = '''	s.complaints[id] = complaint
	return &complaint
}

func (s *Store) GetComplaint'''

new_create = '''	s.complaints[id] = complaint

	s.CreateNotification(
		"新投诉待处理",
		"投诉编号 "+complaint.ComplaintNo+"："+complaint.ComplaintType,
		models.RoleCustomerService,
		"",
		"complaint",
		complaint.ID,
	)

	return &complaint
}

func (s *Store) GetComplaint'''

content = content.replace(old_create, new_create)

# 在 HandleComplaint 的 return 前添加通知创建
old_handle = '''	s.complaints[id] = complaint
	return &complaint, true
}

func (s *Store) GetComplaintDetail'''

new_handle = '''	s.complaints[id] = complaint

	s.CreateNotification(
		"投诉已处理",
		"投诉编号 "+complaint.ComplaintNo+"："+complaint.Status,
		models.RoleCustomerService,
		"",
		"complaint",
		complaint.ID,
	)

	return &complaint, true
}

func (s *Store) GetComplaintDetail'''

content = content.replace(old_handle, new_handle)

with open('internal/store/complaint.go', 'w') as f:
    f.write(content)

print("complaint.go modified successfully")

# 修改 booking.go - 在 UpdateBooking 中添加通知创建
with open('internal/store/booking.go', 'r') as f:
    content = f.read()

old_update = '''	booking.UpdatedAt = time.Now()
	s.bookings[id] = booking

	return &booking, true
}

func (s *Store) GetBookingChangeLogs'''

new_update = '''	booking.UpdatedAt = time.Now()
	s.bookings[id] = booking

	s.CreateNotification(
		"预约已变更",
		"预约编号 "+booking.BookingNo+" 信息已更新",
		models.RoleTicketSupervisor,
		"",
		"booking",
		booking.ID,
	)

	return &booking, true
}

func (s *Store) GetBookingChangeLogs'''

content = content.replace(old_update, new_update)

with open('internal/store/booking.go', 'w') as f:
    f.write(content)

print("booking.go modified successfully")
