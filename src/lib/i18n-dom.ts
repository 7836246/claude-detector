// Client-side DOM i18n for Astro-rendered pages.
// React components use useT() hook instead — this file is only for
// elements with data-i18n attributes in .astro templates.
//
// Dict only needs non-zh translations. Chinese text lives in the HTML
// and is saved to data-i18n-zh on first run, then restored when zh is
// selected.

type Dict = Record<string, Record<string, string>>;

const D: Dict = {
  // -------- Nav --------
  'nav.home': { en: 'Home', ja: 'ホーム', ko: '홈' },
  'nav.faq': { en: 'FAQ', ja: 'よくある質問', ko: 'FAQ' },
  'nav.contact': { en: 'Contact', ja: 'お問い合わせ', ko: '문의' },

  // -------- Hero --------
  'hero.badge': {
    en: 'Anthropic Mom on duty · anthropic.mom',
    ja: 'Anthropic ママが検証 · anthropic.mom',
    ko: 'Anthropic 엄마가 검증 · anthropic.mom',
  },
  'hero.title1': { en: "Let Mom check", ja: 'ママに見せて', ko: '엄마가 확인해볼게' },
  'hero.title2': { en: 'if your Key is legit', ja: 'そのKeyは本物？', ko: '그 Key가 진짜인지' },
  'hero.sub1': {
    en: 'Proxy fraud? Secret model downgrades? Token inflation?',
    ja: 'プロキシ不正？モデルすり替え？トークン水増し？',
    ko: '프록시 사기? 모델 다운그레이드? 토큰 뻥튀기?',
  },
  'hero.sub2': {
    en: 'Leave it to Mom — 19 black-box probes, instant verdict.',
    ja: 'ママにお任せ — 19ラウンドのブラックボックス検証。',
    ko: '엄마에게 맡겨 — 19라운드 블랙박스 검증.',
  },

  // -------- Features section --------
  'features.title': { en: 'How It Works', ja: '仕組み', ko: '작동 방식' },
  'features.sub': {
    en: 'Multi-dimensional cross-validation catches every fake',
    ja: '多次元クロス検証で偽物を見逃さない',
    ko: '다차원 교차 검증으로 가짜를 잡아냅니다',
  },
  'feat.1.title': { en: 'Model Fingerprinting', ja: 'モデル指紋識別', ko: '모델 지문 식별' },
  'feat.1.desc': {
    en: 'Multi-dimensional probes detect if the model has been downgraded or swapped.',
    ja: '多次元プローブでモデルが偽物にすり替えられていないか検出。',
    ko: '다차원 프로브로 모델이 다운그레이드되거나 교체되었는지 감지.',
  },
  'feat.2.title': { en: 'Token Billing Audit', ja: 'トークン課金検証', ko: '토큰 과금 검증' },
  'feat.2.desc': {
    en: 'Compare tokenizer counts against reported usage to catch inflated billing.',
    ja: 'トークナイザーとAPI返却値を比較し、水増し課金を検出。',
    ko: '토크나이저와 API 반환값을 비교하여 과금 뻥튀기를 감지.',
  },
  'feat.3.title': { en: 'Latency Fingerprinting', ja: 'レイテンシ指紋分析', ko: '지연 지문 분석' },
  'feat.3.desc': {
    en: 'TTFT and throughput distribution analysis exposes hidden proxy layers.',
    ja: 'TTFTとスループット分布で隠れたプロキシ層を暴露。',
    ko: 'TTFT와 처리량 분포 분석으로 숨겨진 프록시 계층을 노출.',
  },
  'feat.4.title': { en: 'Anti-Evasion', ja: 'ブラックボックス耐性', ko: '블랙박스 내성' },
  'feat.4.desc': {
    en: 'Randomized canary prompts prevent proxies from gaming the detection.',
    ja: 'ランダム化カナリアプロンプトでプロキシの検出回避を防止。',
    ko: '무작위 카나리아 프롬프트로 프록시의 탐지 우회를 방지.',
  },

  // -------- Vendors section --------
  'vendors.title': { en: 'Verified Proxies', ja: '検証済みプロキシ', ko: '검증된 프록시' },
  'vendors.sub': {
    en: 'Leading proxy services covered by our detection engine',
    ja: '主要プロキシサービスを検証エンジンでカバー',
    ko: '주요 프록시 서비스를 탐지 엔진으로 커버',
  },

  // -------- FAQ --------
  'faq.title': { en: 'FAQ', ja: 'よくある質問', ko: 'FAQ' },
  'faq.sub': {
    en: 'About detection, security, and usage',
    ja: '検出原理、セキュリティ、使い方について',
    ko: '검출 원리, 보안, 사용법에 대해',
  },
  'faq.q1': {
    en: 'Does detection consume my tokens?',
    ja: '検出でトークンを消費しますか？',
    ko: '검출 시 토큰을 소비하나요?',
  },
  'faq.a1': {
    en: 'Yes. Each detection sends ~13 requests to your endpoint, costing roughly $0.02–$0.30 depending on the model. This is unavoidable — real API calls are needed to capture response characteristics.',
    ja: 'はい。各検出はエンドポイントに約13リクエストを送信し、モデルに応じて約$0.02〜$0.30かかります。応答特性を取得するには実際のAPI呼び出しが必要です。',
    ko: '네. 매 검출마다 엔드포인트에 ~13건의 요청을 보내며, 모델에 따라 약 $0.02–$0.30이 소비됩니다. 응답 특성을 수집하려면 실제 API 호출이 필요합니다.',
  },
  'faq.q2': {
    en: 'Do you store my API Key?',
    ja: 'APIキーを保存しますか？',
    ko: 'API Key를 저장하나요?',
  },
  'faq.a2': {
    en: 'No. We use black-box mode — your Key stays in memory only during the request and is discarded immediately after. It is never written to logs, databases, or any persistent storage.',
    ja: 'いいえ。ブラックボックスモードを採用しており、Keyはリクエスト中のメモリにのみ保持され、完了後すぐに破棄されます。ログやデータベースに書き込まれることはありません。',
    ko: '아니요. 블랙박스 모드를 사용하며, Key는 요청 중 메모리에만 보관되고 완료 후 즉시 폐기됩니다. 로그, 데이터베이스, 영구 저장소에 기록되지 않습니다.',
  },
  'faq.q3': {
    en: 'Why ~13 rounds of requests?',
    ja: 'なぜ約13ラウンドのリクエストが必要ですか？',
    ko: '왜 ~13라운드의 요청이 필요한가요?',
  },
  'faq.a3': {
    en: 'A single round is noisy. 19 rounds cover model fingerprinting, token billing, latency, tool use, streaming, and more — statistical methods reduce false positives.',
    ja: '1ラウンドではノイズが多く、13ラウンドでモデル指紋、トークン課金、レイテンシ、ツール使用、ストリーミングなどを網羅し、統計的手法で誤判定を減らします。',
    ko: '1라운드는 노이즈가 많습니다. 13라운드는 모델 지문, 토큰 과금, 지연, 도구 사용, 스트리밍 등을 다루며 통계적 방법으로 오탐을 줄입니다.',
  },
  'faq.q4': {
    en: 'If it passes, is it 100% safe?',
    ja: '合格なら100%安全ですか？',
    ko: '통과하면 100% 안전한가요?',
  },
  'faq.a4': {
    en: 'No. Detection catches known fraud patterns. A sufficiently sophisticated proxy could theoretically pass all probes, but the cost of doing so would exceed just forwarding the real API. Passing means "trustworthy at reasonable cost".',
    ja: 'いいえ。検出は既知の不正パターンを捕捉します。十分に高度なプロキシは理論上すべてのプローブを通過できますが、そのコストは実際のAPIを転送するより高くなります。',
    ko: '아니요. 검출은 알려진 사기 패턴을 잡습니다. 충분히 정교한 프록시는 이론적으로 모든 프로브를 통과할 수 있지만, 그 비용은 실제 API를 전달하는 것보다 높습니다.',
  },
  'faq.q5': {
    en: 'If it fails, is it definitely fake?',
    ja: '不合格なら必ず偽物ですか？',
    ko: '미통과면 반드시 가짜인가요?',
  },
  'faq.a5': {
    en: 'Most likely, but not absolutely. Certain regional routing, custom deployments, or system prompt injection may cause false positives. Try a different network or contact us for review.',
    ja: '高い可能性がありますが、絶対ではありません。地域ルーティングやカスタムデプロイにより誤検出の可能性があります。別のネットワークで再試行するか、お問い合わせください。',
    ko: '대부분 그렇지만 절대적이지는 않습니다. 특정 지역 라우팅이나 커스텀 배포로 오탐이 발생할 수 있습니다. 다른 네트워크에서 재시도하거나 문의하세요.',
  },
  'faq.q6': {
    en: 'Which models are supported?',
    ja: 'どのモデルに対応していますか？',
    ko: '어떤 모델을 지원하나요?',
  },
  'faq.a6': {
    en: 'Currently Claude Opus 4.6, Sonnet 4.6, and Haiku 4.5. More models will be added over time.',
    ja: '現在、Claude Opus 4.6、Sonnet 4.6、Haiku 4.5に対応。今後順次追加予定です。',
    ko: '현재 Claude Opus 4.6, Sonnet 4.6, Haiku 4.5를 지원합니다. 추후 더 추가될 예정입니다.',
  },

  // -------- Contact --------
  'contact.title': { en: 'Contact', ja: 'お問い合わせ', ko: '문의' },
  'contact.sub': {
    en: 'Questions, feedback, or partnership inquiries? Get in touch.',
    ja: 'ご質問、フィードバック、提携のお問い合わせはこちら',
    ko: '질문, 피드백, 제휴 문의는 여기로',
  },

  // -------- Footer --------
  'footer.safe': {
    en: "Mom never stores your API Key · Black-box testing · Open for audit",
    ja: 'APIキーは保存しません · ブラックボックス検証 · 監査可能',
    ko: 'API Key 저장 안함 · 블랙박스 검증 · 감사 가능',
  },
  'footer.disclaimer': {
    en: 'Not affiliated with Anthropic — the name is a community joke',
    ja: 'Anthropic公式とは無関係 — 名前はコミュニティのジョーク',
    ko: 'Anthropic 공식과 무관 — 이름은 커뮤니티 밈',
  },
};

export function applyI18n(): void {
  const locale = localStorage.getItem('locale') ?? 'zh';

  // Fix 4: dynamic html lang
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;

    // Save original Chinese text on first encounter
    if (!el.dataset.i18nZh) {
      el.dataset.i18nZh = el.textContent ?? '';
    }

    if (locale === 'zh') {
      el.textContent = el.dataset.i18nZh;
    } else {
      el.textContent = D[key]?.[locale] ?? el.dataset.i18nZh ?? '';
    }
  });

  // Language selector is now a React component (LocaleSwitch) that
  // syncs via the 'locale-change' event — no DOM sync needed here.
}

// initLocaleSelector is no longer needed — the React LocaleSwitch
// component handles its own state and dispatches 'locale-change'.
