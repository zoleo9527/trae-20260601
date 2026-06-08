# -*- coding: utf-8 -*-
f = "frontend/index.html"
c = open(f, "r", encoding="utf-8").read()
SQ = chr(39)
DQ = chr(34)
NL = chr(10)

# Change 3
old3 = DQ.join(["<div class=", "action-bar", "><h2>", chr(0x9972)+chr(0x6599)+chr(0x9886)+chr(0x7528)+chr(0x5217)+chr(0x8868), "</h2><button v-if=", "currentRole==="+SQ+"technician"+SQ, " class=", "btn btn-primary", " @click=", "showCreateReq=true", ">+ ", chr(0x7533)+chr(0x8bf7)+chr(0x9886)+chr(0x7528), "</button></div>"])
