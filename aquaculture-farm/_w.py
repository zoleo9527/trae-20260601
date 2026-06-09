import json,os,sys; data=json.loads(open(sys.argv[1]).read()); open(sys.argv[2],"w").write(data["content"])
