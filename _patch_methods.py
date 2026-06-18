import sys

path = 'src/seeder/service/seeder.service.ts'
with open(path, 'r') as f:
    content = f.read()

new_methods = '''  async seedMatchingData(intakes: Intake[], housekeepers: Housekeeper[]) {
    const zhouIntake = intakes.find(i => i.customerName === 'å¾„åŒ—å');
    const liuHk = housekeepers.find(h => h.name === 'å°é—®å');
    const wangHk = housekeepers.find(h => h.name === 'ç´¢é—®å');
    const zhaoHk = housekeepers.find(h => h.name === 'èµ°å‘®å');
    const liHk = housekeepers.find(h => h.name === 'æé—®å');
    if (!zhouIntake) return { snapshots: 0, attempts: 0 };
    const round1Attempts = [
      this.matchingAttemptRepo.create({ intakeId: zhouIntake.id, housekeeperId: liuHk.id, round: 1, rank: 1, status: MatchingStatus.RECOMMENDED, score: 80, failReason: MatchingFailReason.NONE, recommendedAt: new Date(), actorRole: Role.SYSTEM, actorId: 'system' }),
      this.matchingAttemptRepo.create({ intakeId: zhouIntake.id, housekeeperId: wangHk.id, round: 1, rank: 2, status: MatchingStatus.RECOMMENDED, score: 60, failReason: MatchingFailReason.AREA_NOT_COVERED, failDetails: 'ç´¢é—®åæ³¨é‡‘èµ„å±•ç‰©ç½‘ï¼Œä¸è¯¦é‡‘èµ„å±•ç¤¾', recommendedAt: new Date(), actorRole: Role.SYSTEM, actorId: 'system' }),
      this.matchingAttemptRepo.create({ intakeId: zhouIntake.id, housekeperId: zhaoHk.id, round: 1, rank: 3, status: MatchingStatus.REJECTED_BY_CUSTOMR, score: 35, failReason: MatchingFailReason.SKILL_MISMATCH, failDetails: 'èµ°åé—®åè¯„æ ¼ä¸è®°å¿ƒã€æ„ç‰‡ï¼Œä¸ä¿è¯ä¿®æ”¹è‡´â€«', recommendedAt: new Date(), customerRejectedAt: new Date(), actorRole: Role.CUSTOME, actorId: zhouIntake.customerPhone }),
    ];
    const round2Attempts = [
      this.matchingAttemptRepo.create({ intakeId: zhouIntake.id, housekeeperId: liuHk.id, round: 2, rank: 1, status: MatchingStatus.ACCEPTED, score: 80, failReason: MatchingFailReason.NONE, recommendedAt: new Date(), acceptedAt: new Date(), actorRole: Role.CUSTOMER, actorId: zhouIntake.customerPhone }),
      this.matchingAttemptRepo.create({ intakeId: zhouIntake.id, housekeeperId: liHk.id, round: 2, rank: 2, status: MatchingStatus.REJECTED_BY_HOUSEKEEPER, score: 40, failReason: MatchingFailReason.SKILL_MISMATCH, failDetails: 'æé—®å>Ø¯˜æ—®æ–Ÿï¼Œä¸ä¿é¯‚ä¿®æ”¹è‡´â€®', recommendedAt: new Date(), housekeeperRejectedAt: new Date(), actorRole: Role.HOUSEKEEPER, actorId: liHk.id }),
    ];
    const savedAttempts: MatchingAttempT[] = [];
    for (const a of [...round1Attempts, ...round2Attempts]) { savedAttempts.push(await this.matchingAttemptRepo.save(a)); }
    const round1Snapshot = this.matchingSnapshotRepo.create({ intakeId: zhouIntake.id, round: 1, generatedBy: 'system', totalCandidates: 3, shortlistedCandidates: 0, snapshotJson: JSON.stringify([{ housekeeperName: 'å°é—®å', score: 80, status: 'RECOMMENDED' }, { housekeperName: 'Ò‹¦^»–B<œ°Í½É”è€ØÀ°ÍÑ…ÑÕÌè€I=559œô°ì¡½ÕÍ•­•Á•É9…µ”è€Ÿ¢ÖÃ–B;¦^»–B<œ°Í½É”è€ÌÔ°ÍÑ…ÑÕÌè€I)Q}	e}UMQ=5Hœõt¤ô¤ì(€€€½¹ÍĞÉ½Õ¹ÉM¹…ÁÍ¡½Ğ€ôÑ¡¥Ì¹µ…Ñ¡¥¹M¹…ÁÍ¡½ÑI•Á¼¹É•…Ñ”¡ì¥¹Ñ…­•%èé¡½Õ%¹Ñ…­”¹¥°É½Õ¹è€È°•¹•É…Ñ•‘	äè€ÍåÍÑ•´œ°Ñ½Ñ…±…¹‘¥‘…Ñ•Ìè€È°Í¡½ÉÑ±¥ÍÑ•‘…¹‘¥‘…Ñ•Ìè€Ä°Í¹…ÁÍ¡½Ñ)Í½¸è)M=8¹ÍÑÉ¥¹¥™ä¡mì¡½ÕÍ•­•Á•É9…µ”è€Ÿ–Â?¦^»–B<œ°Í½É”è€àÀ°ÍÑ…ÑÕÌè€AQœô°ì¡½ÕÍ•­••Á•É9…µ”è€Ÿšv;¦^»–B<œ°Í½É”è€ĞÀ°ÍÑ…ÑÕÌè€I)Q}	e}!=UM-AHœõt¤ô¤ì(€€€…İ…¥ĞÑ¡¥Ì¹µ…Ñ¡¥¹M¹…ÁÍ¡½ÑI•Á¼¹Í…Ù”¡É½Õ¹ÅM¹…ÁÍ¡½Ğ¤ì(€€€…İ…¥ĞÑ¡¥Ì¹µ…Ñ¡¥¹M¹…ÁÍ¡½ÑI•Á¼¹Í…Ù”¡É½Õ¹ÉM¹…ÁÍ¡½Ğ¤ì(€€€É•ÑÕÉ¸ìÍ¹…ÁÍ¡½ÑÌè€È°…ÑÑ•µÁÑÌèÍ…Ù•‘ÑÑ•µÁÑÌ¹±•¹Ñ ôì(€ô((€…Íå¹ŒÍ••‘Õ‘¥Ñ1½Ì¡¥¹Ñ…­•Ìè%¹Ñ…­•mt¤ì(€€€±•Ğ½Õ¹Ğ€ô€Àì(€€€™½È€¡½¹ÍĞ¥¹Ñ…­”½˜¥¹Ñ…­•Ì¤ì(€€€€€…İ…¥ĞÑ¡¥Ì¹…Õ‘¥ÑM•ÉÙ¥”¹ÅÕ¥­1½œ %¹Ñ…­”œ°¥¹Ñ…­”¹¥°Õ‘¥ÑÑ¥½¸¹IQ°ƒ–öO–2Ç–¾‚–ğè€‘í¥¹Ñ…­”¹ÕÍÑ½µ•É9…µ•õ€°ìÉ½±”è¥¹Ñ…­”¹½İ¹•ÉI½±”°¥è¥¹Ñ…­”¹½İ¹•É%°¹…µ”è¥¹Ñ…­”¹½İ¹•É9…µ”ô¤ì(€€€€€½Õ¹Ğ¬¬ì(€€€ô(€€€É•ÑÕÉ¸½Õ¹Ğì(€ô((œœœ()¥¹Í•ÉÑ}¥‘à€ô9½¹”)™½È¤°±¥¹”¥¸•¹Õµ•É…Ñ”¡½¹Ñ•¹Ğ¹ÍÁ±¥Ğ q¸œ¤¤è(€€€¥˜±¥¹”¹ÍÑÉ¥À ¤€ôô€…Íå¹ŒÍ•• ¤ìœè(€€€€€€€¥¹Í•ÉÑ}¥‘à€ô¤(€€€€€€€‰É•…¬()¥˜¥¹Í•ÉÑ}¥‘à¥Ì¹½Ğ9½¹”è(€€€±¥¹•Ì€ô½¹Ñ•¹Ğ¹ÍÁ±¥Ğ q¸œ¤(€€€±¥¹•Ì¹¥¹Í•ÉĞ¡¥¹Í•ÉÑ}¥‘à°¹•İ}µ•Ñ¡½‘Ì¤(€€€İ¥Ñ ½Á•¸¡Á…Ñ °€Üœ¤…Ì˜è(€€€€€€€˜¹İÉ¥Ñ” q¸œ¹©½¥¸¡±¥¹•Ì¤¤(€€€ÁÉ¥¹Ğ 5•Ñ¡½‘Ì¥¹Í•ÉÑ•…Ğ±¥¹”œ°¥¹Í•ÉÑ}¥‘à¤)•±Í”è(€€€ÁÉ¥¹Ğ II=Hè½Õ±¹½Ğ™¥¹¥¹Í•ÉÑ¥½¸Á½¥¹Ğœ¤(