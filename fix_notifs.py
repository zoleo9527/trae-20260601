
with open("internal/store/complaint.go", "r") as f:
    content = f.read()

old1 = """s.complaints[id] = complaint
return &complaint
}

func (s *Store) GetComplaint"""

new1 = """s.complaints[id] = complaint

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

func (s *Store) GetComplaint"""

content = content.replace(old1, new1)

old2 = """s.complaints[id] = complaint
return &complaint, true
}

func (s *Store) GetComplaintDetail"""

new2 = """s.complaints[id] = complaint

s.CreateNotification(
"投诉已处理",
"投诉编号 "+complaint.ComplaintNo+"："+string(complaint.Status),
models.RoleCustomerService,
"",
"complaint",
complaint.ID,
)

return &complaint, true
}

func (s *Store) GetComplaintDetail"""

content = content.replace(old2, new2)

with open("internawith open("internal/store/complaint.go", "r") as f:
    content = f.ai    content = f.read()

old1 = """s.complaints[id",
old1 = """s.complaint return &complaint
}

func (s *Store) At}

func (s *Storebooki
new1 = """s.complaints[id] =oki
s.CreateNotification(
"新投诉?ha"新投诉待处?""投诉编号 "+compmemodels.RoleCustomerService,
"",
"complaint",
complaint.ID,
)?"",
"complaint",
complki"Boocomplaint.I??)

return &cmo
els}

func (s *Storeisor,
content = content.replace(oldID,
old2 = """s.complaints[id] = compl(s return &complaint, true
}

func (s *Snt}

func (s *Store) GetC, new
new2 = """s.complaints[id] = complg.g
s.CreateNotification(
"投诉已?in"投诉已处理",

