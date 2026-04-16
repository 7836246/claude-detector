export type Locale = 'zh' | 'en' | 'ja' | 'ko';

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'zh', label: '中文' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
];

type Dict = Record<string, Record<Locale, string>>;

const d: Dict = {
  // Nav
  'nav.home': { zh: '首页', en: 'Home', ja: 'ホーム', ko: '홈' },
  'nav.faq': { zh: '常见问题', en: 'FAQ', ja: 'よくある質問', ko: 'FAQ' },
  'nav.contact': { zh: '联系妈妈', en: 'Contact', ja: 'お問い合わせ', ko: '문의' },

  // Hero
  'hero.badge': {
    zh: 'a 社妈妈亲自把关 · anthropic.mom',
    en: 'Anthropic Mom on duty · anthropic.mom',
    ja: 'Anthropic ママが検証 · anthropic.mom',
    ko: 'Anthropic 엄마가 검증 · anthropic.mom',
  },
  'hero.title1': {
    zh: '孩子,让妈妈看看',
    en: "Let Mom check",
    ja: 'ママに見せて',
    ko: '엄마가 확인해볼게',
  },
  'hero.title2': {
    zh: '你的 Key 是不是亲生的',
    en: 'if your Key is legit',
    ja: 'そのKeyは本物？',
    ko: '그 Key가 진짜인지',
  },
  'hero.sub1': {
    zh: '中转站掺假?模型被偷偷降级?Token 虚报倍率?',
    en: 'Proxy fraud? Secret model downgrades? Token inflation?',
    ja: 'プロキシ不正？モデルすり替え？トークン水増し？',
    ko: '프록시 사기? 모델 다운그레이드? 토큰 뻥튀기?',
  },
  'hero.sub2': {
    zh: '交给妈妈 — 19 轮黑盒探针,当场验明正身。',
    en: 'Leave it to Mom — 19 black-box probes, instant verdict.',
    ja: 'ママにお任せ — 19ラウンドのブラックボックス検証。',
    ko: '엄마에게 맡겨 — 19라운드 블랙박스 검증.',
  },

  // Form
  'form.endpoint': { zh: 'API 接口地址', en: 'API Endpoint', ja: 'APIエンドポイント', ko: 'API 엔드포인트' },
  'form.apikey': { zh: 'API Key', en: 'API Key', ja: 'APIキー', ko: 'API Key' },
  'form.model': { zh: '检测目标模型', en: 'Target Model', ja: '検出対象モデル', ko: '검출 대상 모델' },
  'form.rounds': {
    zh: '基础检测,约 18 轮请求',
    en: '~18 rounds of basic probes',
    ja: '基本検出、約18ラウンド',
    ko: '기본 검출, 약 18라운드',
  },
  'form.rounds_audit': {
    zh: '完整检测 + Token 审计,约 19 轮请求',
    en: '~19 rounds with token audit',
    ja: '完全検出 + トークン監査、約19ラウンド',
    ko: '전체 검출 + 토큰 감사, 약 19라운드',
  },
  'form.token_audit': {
    zh: 'Token 用量审计',
    en: 'Token Usage Audit',
    ja: 'トークン使用量監査',
    ko: '토큰 사용량 감사',
  },
  'form.token_audit_desc': {
    zh: '检测 Token 使用量是否异常(实际倍率 / 消费合理性),会额外消耗约 $0.3',
    en: 'Detect abnormal token usage (billing ratio / cost reasonableness), costs ~$0.3 extra',
    ja: 'トークン使用量の異常を検出(課金倍率/消費合理性)、約$0.3追加消費',
    ko: '토큰 사용량 이상 감지(과금 배율/소비 합리성), ~$0.3 추가 소비',
  },
  'form.est': { zh: '预计消耗', en: 'Est. cost', ja: '推定コスト', ko: '예상 비용' },
  'form.submit': { zh: '交给妈妈检查', en: 'Let Mom Check', ja: 'ママに検証させる', ko: '엄마에게 맡기기' },
  'form.cancel': { zh: '取消', en: 'Cancel', ja: 'キャンセル', ko: '취소' },
  'form.key_safe': {
    zh: '黑盒检测,不会存储、记录或上传你的 Key',
    en: 'Black-box testing — your Key is never stored or uploaded',
    ja: 'ブラックボックス検証 — Keyは保存されません',
    ko: '블랙박스 검증 — Key는 저장되지 않습니다',
  },
  'form.progress': { zh: '已完成', en: 'Completed', ja: '完了', ko: '완료' },
  'form.of': { zh: '轮探针...', en: 'probes...', ja: 'プローブ...', ko: '프로브...' },

  // Report
  'report.title': { zh: '检测结果', en: 'Detection Result', ja: '検出結果', ko: '검출 결과' },
  'report.conclusion': { zh: '判定结论', en: 'Verdict', ja: '判定結論', ko: '판정 결론' },
  'report.share': { zh: '分享结果', en: 'Share Result', ja: '結果を共有', ko: '결과 공유' },
  'report.copied': { zh: '链接已复制', en: 'Link copied', ja: 'リンクをコピー', ko: '링크 복사됨' },
  'report.retry': { zh: '再测一次', en: 'Test Again', ja: 'もう一度テスト', ko: '다시 테스트' },
  'report.detail': { zh: '查看探针详细结果', en: 'View probe details', ja: 'プローブ詳細を見る', ko: '프로브 상세 보기' },
  'report.failed': { zh: '检测失败', en: 'Detection Failed', ja: '検出失敗', ko: '검출 실패' },

  // Verdict (legacy keys for backward compat with old Report fallback)
  'verdict.genuine': { zh: '正品', en: 'Authentic', ja: '正規品', ko: '정품' },
  'verdict.fake': { zh: '假冒', en: 'Counterfeit', ja: '偽物', ko: '위조' },

  // Stats
  'stat.latency': { zh: '延迟', en: 'Latency', ja: 'レイテンシ', ko: '지연' },
  'stat.tps': { zh: 'TOKENS/秒', en: 'TOKENS/s', ja: 'TOKENS/秒', ko: 'TOKENS/초' },
  'stat.input': { zh: '输入 TOKENS', en: 'Input TOKENS', ja: '入力TOKENS', ko: '입력 TOKENS' },
  'stat.output': { zh: '输出 TOKENS', en: 'Output TOKENS', ja: '出力TOKENS', ko: '출력 TOKENS' },

  // Audit
  'audit.title': { zh: 'Token 用量审计报告', en: 'Token Usage Audit', ja: 'トークン使用量監査', ko: '토큰 사용량 감사' },
  'audit.normal_range': { zh: '偏差属于正常范围', en: 'within normal range', ja: '正常範囲内', ko: '정상 범위' },
  'audit.high': { zh: '偏差偏高', en: 'above normal', ja: '偏差高め', ko: '편차 높음' },
  'audit.critical': { zh: '偏差严重异常', en: 'critically abnormal', ja: '重大異常', ko: '심각한 이상' },
  'audit.warning': {
    zh: '实际花费 = 本报告倍率 × 您所用平台的倍率(单价)。倍率差异可能来自缓存命中差异或平台暗改 Token 数量。',
    en: 'Actual cost = report ratio × your platform multiplier. Ratio differences may stem from cache variance or platform-side token manipulation.',
    ja: '実コスト = レポート倍率 × プラットフォーム倍率。差異はキャッシュの違いまたはトークン操作に起因する可能性。',
    ko: '실제 비용 = 보고서 배율 × 플랫폼 배율. 배율 차이는 캐시 차이 또는 플랫폼 토큰 조작에 기인할 수 있습니다.',
  },
  'audit.baseline': { zh: '官方基线', en: 'Official Baseline', ja: '公式ベースライン', ko: '공식 기준' },
  'audit.actual': { zh: '实际消耗', en: 'Actual Cost', ja: '実際消費', ko: '실제 소비' },
  'audit.ratio': { zh: '倍率', en: 'Ratio', ja: '倍率', ko: '배율' },
  'audit.cache_hit': { zh: '缓存命中率', en: 'Cache Hit Rate', ja: 'キャッシュヒット率', ko: '캐시 적중률' },
  'audit.normal': { zh: '用量正常', en: 'Usage Normal', ja: '使用量正常', ko: '사용량 정상' },
  'audit.anomaly': { zh: '轮异常', en: 'anomalous rounds', ja: 'ラウンド異常', ko: '라운드 이상' },

  // Table headers
  'table.round': { zh: '#', en: '#', ja: '#', ko: '#' },
  'table.input': { zh: '输入', en: 'Input', ja: '入力', ko: '입력' },
  'table.output': { zh: '输出', en: 'Output', ja: '出力', ko: '출력' },
  'table.cache_create': { zh: '缓存创建', en: 'Cache Write', ja: 'キャッシュ作成', ko: '캐시 생성' },
  'table.cache_read': { zh: '缓存读取', en: 'Cache Read', ja: 'キャッシュ読取', ko: '캐시 읽기' },
  'table.cost': { zh: '实际消耗', en: 'Cost', ja: 'コスト', ko: '비용' },

  // Categories
  'cat.structural': { zh: '结构完整性', en: 'Structural Integrity', ja: '構造整合性', ko: '구조 무결성' },
  'cat.signature': { zh: '签名校验', en: 'Signature Check', ja: '署名検証', ko: '서명 검증' },
  'cat.signature_authenticity': { zh: '签名真实性验证', en: 'Signature Authenticity', ja: '署名真正性検証', ko: '서명 진위 검증' },
  'cat.behavior': { zh: '行为验证', en: 'Behavior Validation', ja: '動作検証', ko: '동작 검증' },
  'cat.llm_fingerprint': { zh: 'LLM 指纹验证', en: 'LLM Fingerprint', ja: 'LLM指紋検証', ko: 'LLM 지문 검증' },
  'cat.multimodal': { zh: '多模态能力', en: 'Multimodal', ja: 'マルチモーダル', ko: '멀티모달' },
  'cat.token_audit': { zh: 'Token 用量审计', en: 'Token Audit', ja: 'トークン監査', ko: '토큰 감사' },

  // Category pass/fail
  'cat.pass': { zh: '通过', en: 'Pass', ja: '合格', ko: '통과' },
  'cat.fail': { zh: '未通过', en: 'Fail', ja: '不合格', ko: '미통과' },

  // Verdict results (LDS-compatible)
  'verdict.authentic': { zh: '正品', en: 'Authentic', ja: '正規品', ko: '정품' },
  'verdict.authentic_degraded': { zh: '正品 (有瑕疵)', en: 'Authentic (Degraded)', ja: '正規品 (劣化あり)', ko: '정품 (결함 있음)' },
  'verdict.third_party': { zh: '第三方转发', en: 'Third-Party', ja: 'サードパーティ', ko: '서드파티' },
  'verdict.suspicious': { zh: '存疑', en: 'Suspicious', ja: '要注意', ko: '의심' },
  'verdict.counterfeit': { zh: '假冒', en: 'Counterfeit', ja: '偽物', ko: '위조' },
  'verdict.inconclusive': { zh: '无法判定', en: 'Inconclusive', ja: '判定不能', ko: '판정 불가' },
  // Channels
  'channel.anthropic': { zh: 'Anthropic 官方 API', en: 'Anthropic Official API', ja: 'Anthropic公式API', ko: 'Anthropic 공식 API' },
  'channel.subscription': { zh: 'Claude Max / Pro 订阅', en: 'Claude Max / Pro', ja: 'Claude Max / Pro', ko: 'Claude Max / Pro' },
  'channel.cloud': { zh: '云平台 (Bedrock / Vertex)', en: 'Cloud (Bedrock / Vertex)', ja: 'クラウド (Bedrock / Vertex)', ko: '클라우드 (Bedrock / Vertex)' },
  'channel.proxy': { zh: '第三方中转', en: 'Third-Party Proxy', ja: 'サードパーティプロキシ', ko: '서드파티 프록시' },
  'channel.reverse-proxy': { zh: '逆向接入', en: 'Reverse-Engineered', ja: '逆向エンジニアリング', ko: '리버스 엔지니어링' },
  'tier.market_price': { zh: '市场参考价', en: 'Market Ref. Price', ja: '市場参考価格', ko: '시장 참고가' },
  'tier.confidence': { zh: '置信度', en: 'Confidence', ja: '信頼度', ko: '신뢰도' },
  'tier.signals': { zh: '判定依据', en: 'Signals', ja: '判定根拠', ko: '판정 근거' },
  'tier.unknown_source': { zh: '来源未知', en: 'Source unknown', ja: '出所不明', ko: '출처 미상' },

  // Verdict descriptions
  'verdict.desc.authentic': {
    zh: '所有检测项通过,接口行为与官方 API 完全一致,可放心使用',
    en: 'All probes passed; behavior matches the official API exactly.',
    ja: 'すべての検証を通過し、挙動は公式APIと完全一致しています。',
    ko: '모든 검증을 통과했으며 동작이 공식 API와 완전히 일치합니다.',
  },
  'verdict.desc.authentic_degraded': {
    zh: '模型是真的,但检测到额外注入或轻微计费偏差,功能不受影响',
    en: 'Genuine model, but mild injection or billing drift detected — functionality unaffected.',
    ja: 'モデルは本物ですが、軽微なプロンプト注入または課金ズレを検出しました。',
    ko: '모델은 진짜이나 가벼운 주입 또는 과금 편차가 감지되었습니다.',
  },
  'verdict.desc.third_party': {
    zh: '真实 Claude 模型,通过非官方渠道转发,功能正常',
    en: 'Real Claude model, forwarded through a third-party channel; functionality is normal.',
    ja: '本物のClaudeモデルですが、非公式チャネル経由で転送されています。',
    ko: '실제 Claude 모델이지만 비공식 채널을 통해 전달되고 있습니다.',
  },
  'verdict.desc.suspicious': {
    zh: '多项指标异常,可能被篡改或降级,建议谨慎使用',
    en: 'Multiple anomalies detected; the endpoint may be tampered or downgraded.',
    ja: '複数の異常を検出しました。改ざんまたはダウングレードの可能性があります。',
    ko: '여러 이상이 감지되었습니다. 변조 또는 다운그레이드 가능성이 있습니다.',
  },
  'verdict.desc.counterfeit': {
    zh: '响应特征与 Claude 不符,疑似使用其他模型冒充',
    en: 'Response characteristics do not match Claude; another model is likely impersonating it.',
    ja: '応答特性がClaudeと一致しません。別のモデルによる偽装が疑われます。',
    ko: '응답 특성이 Claude와 일치하지 않습니다. 다른 모델의 위장이 의심됩니다.',
  },
  'verdict.desc.inconclusive': {
    zh: '连通性测试失败或数据不足,无法做出判定',
    en: 'Connectivity failed or data is insufficient; verdict cannot be determined.',
    ja: '接続失敗またはデータ不足のため、判定できません。',
    ko: '연결 실패 또는 데이터 부족으로 판정할 수 없습니다.',
  },

  // Market prices (per channel)
  'channel.market_price.anthropic': {
    zh: '官方定价 (Opus: $15/$75 per 1M)',
    en: 'Official pricing (Opus: $15/$75 per 1M)',
    ja: '公式価格 (Opus: $15/$75 per 1M)',
    ko: '공식 가격 (Opus: $15/$75 per 1M)',
  },
  'channel.market_price.subscription': {
    zh: 'Claude Max ~$200/月 或 Pro $20/月',
    en: 'Claude Max ~$200/mo or Pro $20/mo',
    ja: 'Claude Max 約$200/月 または Pro $20/月',
    ko: 'Claude Max 약 $200/월 또는 Pro $20/월',
  },
  'channel.market_price.cloud': {
    zh: '云平台加价 ~1.2-1.5x 官方',
    en: 'Cloud provider markup ~1.2-1.5x official',
    ja: 'クラウド加算 ~1.2-1.5x 公式',
    ko: '클라우드 가산 ~1.2-1.5x 공식',
  },
  'channel.market_price.proxy': {
    zh: '中转约 2-3 元/刀',
    en: 'Proxy relay ~2-3 CNY per USD',
    ja: 'プロキシ中継 ~2-3 CNY/USD',
    ko: '프록시 ~2-3 CNY/USD',
  },
  'channel.market_price.reverse-proxy': {
    zh: '逆向约 0.5-1.5 元/刀',
    en: 'Reverse-engineered ~0.5-1.5 CNY per USD',
    ja: '逆向 ~0.5-1.5 CNY/USD',
    ko: '리버스 엔지니어링 ~0.5-1.5 CNY/USD',
  },
  'channel.market_price.unknown': {
    zh: '—', en: '—', ja: '—', ko: '—',
  },

  // Verdict signals
  'signal.connectivity_failed': {
    zh: '连通性测试失败,无法建立连接或鉴权失败',
    en: 'Connectivity failed — cannot connect or auth rejected.',
    ja: '接続テスト失敗 — 接続不可または認証拒否。',
    ko: '연결 테스트 실패 — 접속 불가 또는 인증 거부.',
  },
  'signal.self_id_and_echo_mismatch': {
    zh: '模型自报身份非 Claude 且 response.model 不匹配',
    en: 'Self-identification is not Claude and response.model does not match.',
    ja: '自己識別がClaudeではなく、response.modelも不一致。',
    ko: '자기 식별이 Claude가 아니고 response.model도 불일치.',
  },
  'signal.self_id_not_claude': {
    zh: '模型未自报为 Claude/Anthropic',
    en: 'Model does not self-identify as Claude/Anthropic.',
    ja: 'モデルがClaude/Anthropicと自己識別しません。',
    ko: '모델이 Claude/Anthropic으로 자기 식별하지 않음.',
  },
  'signal.model_echo_mismatch': {
    zh: 'response.model 与请求不匹配',
    en: 'response.model does not match request.',
    ja: 'response.modelが要求と不一致。',
    ko: 'response.model이 요청과 일치하지 않음.',
  },
  'signal.system_prompt_injection': {
    zh: '检测到隐藏 System Prompt 注入',
    en: 'Hidden system prompt injection detected.',
    ja: '隠されたシステムプロンプト注入を検出。',
    ko: '숨겨진 시스템 프롬프트 주입 감지.',
  },
  'signal.inconsistent_request_id': {
    zh: '请求 ID 重复或 input_tokens 不一致',
    en: 'Duplicate request ID or inconsistent input_tokens.',
    ja: 'リクエストIDの重複またはinput_tokensの不一致。',
    ko: '요청 ID 중복 또는 input_tokens 불일치.',
  },
  'signal.missing_anthropic_headers': {
    zh: '响应头缺少 Anthropic 特征',
    en: 'Response headers lack Anthropic fingerprint.',
    ja: '応答ヘッダーにAnthropicの特徴がありません。',
    ko: '응답 헤더에 Anthropic 지문이 없음.',
  },
  'signal.schema_incomplete': {
    zh: '响应 Schema 不完整',
    en: 'Response schema incomplete.',
    ja: '応答スキーマが不完全。',
    ko: '응답 스키마 불완전.',
  },
  'signal.multimodal_anomaly': {
    zh: '多模态输入异常',
    en: 'Multimodal input behaves abnormally.',
    ja: 'マルチモーダル入力が異常。',
    ko: '멀티모달 입력 이상.',
  },
  'signal.reasoning_fingerprint_failed': {
    zh: '推理指纹未通过',
    en: 'Reasoning fingerprint did not match.',
    ja: '推論指紋が一致しません。',
    ko: '추론 지문이 일치하지 않음.',
  },
  'signal.tool_use_unsupported': {
    zh: 'tool_use 不支持',
    en: 'tool_use not supported.',
    ja: 'tool_useがサポートされていません。',
    ko: 'tool_use 미지원.',
  },
  'signal.streaming_abnormal': {
    zh: 'SSE 流式异常',
    en: 'SSE streaming abnormal.',
    ja: 'SSEストリーミング異常。',
    ko: 'SSE 스트리밍 이상.',
  },
  'signal.count_tokens_unavailable': {
    zh: 'count_tokens 不可用',
    en: 'count_tokens unavailable.',
    ja: 'count_tokensが利用できません。',
    ko: 'count_tokens 사용 불가.',
  },
  'signal.error_schema_nonstandard': {
    zh: '错误格式非官方 Schema',
    en: 'Error schema does not follow official format.',
    ja: 'エラースキーマが公式形式と異なります。',
    ko: '오류 스키마가 공식 형식과 다름.',
  },
  'signal.prompt_cache_unsupported': {
    zh: 'Prompt Caching 不支持',
    en: 'Prompt caching not supported.',
    ja: 'プロンプトキャッシュ未対応。',
    ko: '프롬프트 캐싱 미지원.',
  },
  'signal.document_unsupported': {
    zh: 'PDF 文档输入不支持',
    en: 'PDF document input not supported.',
    ja: 'PDF文書入力未対応。',
    ko: 'PDF 문서 입력 미지원.',
  },
  'signal.consistency_anomaly': {
    zh: '请求一致性异常',
    en: 'Request-consistency anomaly.',
    ja: 'リクエスト一貫性の異常。',
    ko: '요청 일관성 이상.',
  },
  'signal.all_core_passed_matched': {
    zh: '所有核心检测通过',
    en: 'All core checks passed.',
    ja: 'コア検証をすべて通過。',
    ko: '모든 핵심 검증 통과.',
  },
  'signal.token_usage_matches_baseline': {
    zh: 'Token 用量与官方基线一致',
    en: 'Token usage matches the official baseline.',
    ja: 'トークン使用量が公式ベースラインと一致。',
    ko: '토큰 사용량이 공식 기준과 일치.',
  },
  'signal.official_headers_present': {
    zh: '官方响应头完整',
    en: 'Official response headers complete.',
    ja: '公式応答ヘッダーが完全。',
    ko: '공식 응답 헤더 완비.',
  },
  'signal.token_drift_within_range': {
    zh: 'Token 偏差在正常范围',
    en: 'Token drift within normal range.',
    ja: 'トークン偏差は正常範囲内。',
    ko: '토큰 편차가 정상 범위 내.',
  },
  'signal.core_passed_no_audit': {
    zh: '核心检测通过',
    en: 'Core checks passed.',
    ja: 'コア検証を通過。',
    ko: '핵심 검증 통과.',
  },
  'signal.token_audit_disabled': {
    zh: '未启用 Token 审计',
    en: 'Token audit not enabled.',
    ja: 'トークン監査は無効。',
    ko: '토큰 감사 비활성화.',
  },
  'signal.token_ratio_high': {
    zh: 'Token 倍率 {{ratio}}x 偏高',
    en: 'Token multiplier {{ratio}}x is higher than normal.',
    ja: 'トークン倍率 {{ratio}}x は高めです。',
    ko: '토큰 배율 {{ratio}}x가 높음.',
  },
  'signal.token_ratio': {
    zh: 'Token 倍率 {{ratio}}x',
    en: 'Token multiplier {{ratio}}x.',
    ja: 'トークン倍率 {{ratio}}x。',
    ko: '토큰 배율 {{ratio}}x.',
  },
  'signal.injection_detected_but_functional': {
    zh: '功能正常但检测到隐藏 Prompt 注入',
    en: 'Functionality intact but hidden prompt injection detected.',
    ja: '機能は正常だが、隠されたプロンプト注入を検出。',
    ko: '기능은 정상이나 숨겨진 프롬프트 주입 감지.',
  },
  'signal.most_behavior_passed': {
    zh: '大部分功能正常',
    en: 'Most behavioral checks passed.',
    ja: '大部分の機能が正常。',
    ko: '대부분의 기능 검증 통과.',
  },
  'signal.most_behavior_passed_short': {
    zh: '大部分功能检测通过',
    en: 'Most behavior checks passed.',
    ja: '大部分の機能検証を通過。',
    ko: '대부분의 기능 검증 통과.',
  },
  'signal.behavior_score': {
    zh: '行为检测通过 {{passed}}/{{total}}',
    en: 'Behavior checks passed {{passed}}/{{total}}.',
    ja: '動作検証 {{passed}}/{{total}}。',
    ko: '동작 검증 {{passed}}/{{total}}.',
  },

  // Audit anomaly messages (per-round and summary)
  'anomaly.input_inflated': {
    zh: 'R{{round}} 输入 token 虚报 +{{pct}}% (报告 {{billed}}, 实际 {{honest}})',
    en: 'R{{round}} input tokens inflated +{{pct}}% (billed {{billed}}, actual {{honest}})',
    ja: 'R{{round}} 入力トークン水増し +{{pct}}% (報告 {{billed}}, 実際 {{honest}})',
    ko: 'R{{round}} 입력 토큰 뻥튀기 +{{pct}}% (보고 {{billed}}, 실제 {{honest}})',
  },
  'anomaly.output_inflated': {
    zh: 'R{{round}} 输出 token 虚报 +{{pct}}% (报告 {{billed}}, 实际 {{honest}})',
    en: 'R{{round}} output tokens inflated +{{pct}}% (billed {{billed}}, actual {{honest}})',
    ja: 'R{{round}} 出力トークン水増し +{{pct}}% (報告 {{billed}}, 実際 {{honest}})',
    ko: 'R{{round}} 출력 토큰 뻥튀기 +{{pct}}% (보고 {{billed}}, 실제 {{honest}})',
  },
  'anomaly.input_deflated': {
    zh: 'R{{round}} 输入 token 低于预期 (报告 {{billed}}, 预期 {{honest}})',
    en: 'R{{round}} input tokens below expected (billed {{billed}}, expected {{honest}})',
    ja: 'R{{round}} 入力トークンが予想より少ない (報告 {{billed}}, 予想 {{honest}})',
    ko: 'R{{round}} 입력 토큰이 예상보다 적음 (보고 {{billed}}, 예상 {{honest}})',
  },
  'anomaly.cost_ratio_critical': {
    zh: 'R{{round}} 成本倍率 {{ratio}}x 严重偏高',
    en: 'R{{round}} cost ratio {{ratio}}x critically high',
    ja: 'R{{round}} コスト倍率 {{ratio}}x は重大な偏差',
    ko: 'R{{round}} 비용 배율 {{ratio}}x 심각하게 높음',
  },
  'anomaly.cost_ratio_high': {
    zh: 'R{{round}} 成本倍率 {{ratio}}x 偏高',
    en: 'R{{round}} cost ratio {{ratio}}x higher than normal',
    ja: 'R{{round}} コスト倍率 {{ratio}}x が高め',
    ko: 'R{{round}} 비용 배율 {{ratio}}x 높음',
  },
  'anomaly.missing_usage': {
    zh: 'R{{round}} usage 字段全部为零',
    en: 'R{{round}} usage fields are all zero',
    ja: 'R{{round}} usageフィールドがすべてゼロ',
    ko: 'R{{round}} usage 필드가 모두 0',
  },
  'anomaly.overall_ratio_critical': {
    zh: '总体成本倍率 {{ratio}}x,严重超出正常范围',
    en: 'Overall cost ratio {{ratio}}x — critically out of range',
    ja: '総コスト倍率 {{ratio}}x — 重大に範囲外',
    ko: '전체 비용 배율 {{ratio}}x — 범위를 심각하게 벗어남',
  },
  'anomaly.overall_ratio_high': {
    zh: '总体成本倍率 {{ratio}}x,高于正常范围',
    en: 'Overall cost ratio {{ratio}}x — above normal range',
    ja: '総コスト倍率 {{ratio}}x — 正常範囲超過',
    ko: '전체 비용 배율 {{ratio}}x — 정상 범위 초과',
  },
  'anomaly.cache_anomaly': {
    zh: '存在缓存创建 ({{create}} tokens) 但无缓存读取,缓存可能未生效',
    en: 'Cache writes occurred ({{create}} tokens) but no reads — caching may be broken.',
    ja: 'キャッシュ作成 ({{create}} tokens) はあるが読取なし — キャッシュ未作動の可能性。',
    ko: '캐시 생성 ({{create}} tokens)은 있으나 읽기가 없음 — 캐시가 작동하지 않을 수 있음.',
  },

  // Runner
  'runner.probe_exception': {
    zh: '异常: {{msg}}',
    en: 'exception: {{msg}}',
    ja: '例外: {{msg}}',
    ko: '예외: {{msg}}',
  },

  // Result page (shared result view)
  'result.title': { zh: '检测结果', en: 'Detection Result', ja: '検出結果', ko: '검출 결과' },
  'result.not_found': { zh: '结果未找到', en: 'Result not found', ja: '結果が見つかりません', ko: '결과를 찾을 수 없음' },
  'result.expired': {
    zh: '该检测结果不存在或已过期(结果保留 1 小时)。',
    en: 'This result does not exist or has expired (results kept for 1 hour).',
    ja: '結果が存在しないか期限切れです (保存期間1時間)。',
    ko: '결과가 존재하지 않거나 만료되었습니다 (1시간 보관).',
  },
  'result.back_home': { zh: '返回首页重新检测', en: 'Back to home — run again', ja: 'ホームに戻って再検証', ko: '홈으로 돌아가 다시 검증' },

  // Captcha widget
  'captcha.tencent_click': { zh: '点击进行人机验证', en: 'Click to verify', ja: 'クリックして認証', ko: '클릭하여 인증' },
  'captcha.loading': { zh: '加载验证码中...', en: 'Loading captcha...', ja: 'キャプチャ読込中...', ko: '캡차 로딩 중...' },

  // API validation errors (server-side, via Accept-Language)
  'error.rate_limit': {
    zh: '请求过于频繁,请稍后再试',
    en: 'Too many requests, please try later',
    ja: 'リクエストが多すぎます。しばらくお待ちください',
    ko: '요청이 너무 많습니다. 잠시 후 다시 시도하세요',
  },
  'error.turnstile': {
    zh: '人机验证失败,请刷新页面重试',
    en: 'Verification failed, please refresh and try again',
    ja: '認証に失敗しました。ページを更新して再試行してください',
    ko: '인증 실패, 페이지를 새로고침하고 다시 시도하세요',
  },
  'error.invalid_json': {
    zh: '无效的 JSON 请求体',
    en: 'Invalid JSON request body',
    ja: '無効なJSONリクエストボディ',
    ko: '잘못된 JSON 요청 본문',
  },
  'error.endpoint_required': {
    zh: 'endpoint 必填',
    en: 'endpoint is required',
    ja: 'endpointは必須です',
    ko: 'endpoint는 필수입니다',
  },
  'error.endpoint_invalid': {
    zh: 'endpoint 必须以 http(s):// 开头',
    en: 'endpoint must start with http(s)://',
    ja: 'endpointは http(s):// で始まる必要があります',
    ko: 'endpoint는 http(s)://로 시작해야 합니다',
  },
  'error.endpoint_too_long': {
    zh: 'endpoint 过长',
    en: 'endpoint is too long',
    ja: 'endpointが長すぎます',
    ko: 'endpoint가 너무 깁니다',
  },
  'error.endpoint_private': {
    zh: 'endpoint 指向内网或保留地址,已被拒绝',
    en: 'endpoint points to a private or reserved address',
    ja: 'endpointが内部ネットワークまたは予約アドレスを指しています',
    ko: 'endpoint가 내부 네트워크 또는 예약 주소를 가리킵니다',
  },
  'error.endpoint_dns': {
    zh: '无法解析 endpoint 主机名',
    en: 'endpoint hostname cannot be resolved',
    ja: 'endpointホスト名を解決できません',
    ko: 'endpoint 호스트 이름을 확인할 수 없습니다',
  },
  'error.endpoint_userinfo': {
    zh: 'endpoint 不得包含用户名或密码',
    en: 'endpoint must not contain userinfo',
    ja: 'endpointにユーザー情報を含めないでください',
    ko: 'endpoint에 사용자 정보를 포함할 수 없습니다',
  },
  'error.probe_failed': {
    zh: '探测失败,请检查 endpoint 与 API Key 后重试',
    en: 'Probe failed, please verify endpoint and API key',
    ja: 'プローブ失敗、endpointとAPIキーをご確認ください',
    ko: '프로브 실패, endpoint와 API 키를 확인하세요',
  },
  'error.apikey_required': {
    zh: 'apiKey 必填',
    en: 'apiKey is required',
    ja: 'apiKeyは必須です',
    ko: 'apiKey는 필수입니다',
  },
  'error.apikey_invalid': {
    zh: 'apiKey 长度非法',
    en: 'apiKey length is invalid',
    ja: 'apiKeyの長さが不正です',
    ko: 'apiKey 길이가 잘못되었습니다',
  },
  'error.model_required': {
    zh: 'model 必填',
    en: 'model is required',
    ja: 'modelは必須です',
    ko: 'model은 필수입니다',
  },
  'error.model_too_long': {
    zh: 'model 过长',
    en: 'model is too long',
    ja: 'modelが長すぎます',
    ko: 'model이 너무 깁니다',
  },

  // Features section
  'features.title': { zh: '如何工作', en: 'How It Works', ja: '仕組み', ko: '작동 방식' },
  'features.sub': {
    zh: '四个维度交叉验证,让掺假无所遁形',
    en: 'Four-dimensional cross-validation catches every fake',
    ja: '4次元クロス検証で偽物を見逃さない',
    ko: '4차원 교차 검증으로 가짜를 잡아냅니다',
  },

  // Vendors section
  'vendors.title': { zh: '已被检测覆盖的中转站', en: 'Verified Proxies', ja: '検証済みプロキシ', ko: '검증된 프록시' },
  'vendors.sub': {
    zh: '数十家龙头中转站均已进入本平台检测库',
    en: 'Leading proxy services covered by our detection engine',
    ja: '主要プロキシサービスを検証済み',
    ko: '주요 프록시 서비스를 검증 완료',
  },

  // Footer
  'footer.tagline': {
    zh: '最专业的 Claude API 检测平台',
    en: 'The most professional Claude API verification platform',
    ja: '最もプロフェッショナルなClaude API検証プラットフォーム',
    ko: '가장 전문적인 Claude API 검증 플랫폼',
  },
  'footer.safe': {
    zh: '妈妈不会存储你的 API Key · 黑盒检测 · 开源可审计',
    en: "Mom never stores your API Key · Black-box testing · Open for audit",
    ja: 'APIキーは保存しません · ブラックボックス検証 · 監査可能',
    ko: 'API Key 저장 안함 · 블랙박스 검증 · 감사 가능',
  },
  'footer.disclaimer': {
    zh: '本站与 Anthropic 官方无任何关联,名称仅为社区玩梗',
    en: 'Not affiliated with Anthropic — the name is a community joke',
    ja: 'Anthropic公式とは無関係 — 名前はコミュニティのジョーク',
    ko: 'Anthropic 공식과 무관 — 이름은 커뮤니티 밈',
  },
};

export function t(
  key: string,
  locale: Locale = 'zh',
  params?: Record<string, string | number>,
): string {
  const raw = d[key]?.[locale] ?? d[key]?.zh ?? key;
  if (!params) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
  );
}

// Detect locale from Accept-Language header (server-side).
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'zh';
  const lower = acceptLanguage.toLowerCase();
  // Check primary language tag first
  const primary = lower.split(',')[0]?.trim() ?? '';
  if (primary.startsWith('zh')) return 'zh';
  if (primary.startsWith('en')) return 'en';
  if (primary.startsWith('ja')) return 'ja';
  if (primary.startsWith('ko')) return 'ko';
  // Fallback: scan whole header
  if (/\ben\b/.test(lower)) return 'en';
  if (/\bja\b/.test(lower)) return 'ja';
  if (/\bko\b/.test(lower)) return 'ko';
  return 'zh';
}
