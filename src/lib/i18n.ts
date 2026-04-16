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

export function t(key: string, locale: Locale = 'zh'): string {
  return d[key]?.[locale] ?? d[key]?.zh ?? key;
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
