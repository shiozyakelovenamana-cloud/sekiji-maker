import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50"
      style={{ fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic UI',sans-serif" }}>

      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/')}
          className="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1.5 transition-colors">
          ← 戻る
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-sm">🪑</span>
          </div>
          <span className="text-sm font-bold text-stone-700">席次メーカー</span>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-stone-800">プライバシーポリシー</h1>
        <p className="text-xs text-stone-400">最終更新日：2026年6月18日</p>

        <Section title="1. 運営者情報">
          <p>本アプリ「席次メーカー」は、以下の連絡先にて運営しています。</p>
          <p>メール：<a href="mailto:bonitotsukudani@gmail.com" className="text-amber-600 underline">bonitotsukudani@gmail.com</a></p>
        </Section>

        <Section title="2. 収集する情報">
          <p>本アプリでは、以下の情報を収集する場合があります。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>アクセスログ（IPアドレス、ブラウザの種類、アクセス日時など）</li>
            <li>Cookie および類似の技術を通じた情報</li>
            <li>広告配信のための匿名の行動データ</li>
          </ul>
          <p>なお、アプリ内で入力された名前・イベント情報等は、お使いの端末のブラウザ内（LocalStorage）にのみ保存され、外部サーバーへ送信されることはありません。</p>
        </Section>

        <Section title="3. 広告について">
          <p>本アプリでは、今後 Google AdSense などの第三者配信の広告サービスを利用する予定があります。</p>
          <p>広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。Cookie を無効にする方法や、Google による Cookie の使用については、<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">Google のポリシーと規約</a>をご覧ください。</p>
        </Section>

        <Section title="4. アクセス解析について">
          <p>本アプリでは、サービス改善のため Google Analytics 等のアクセス解析ツールを将来的に導入する場合があります。これらのツールはトラフィックデータの収集のために Cookie を使用します。収集されるデータは匿名であり、個人を特定するものではありません。</p>
        </Section>

        <Section title="5. 個人情報の管理">
          <p>本アプリは、ユーザーから提供を受けた個人情報を、サービスの提供・改善の目的以外に利用しません。また、法令に基づく場合を除き、第三者に提供することはありません。</p>
        </Section>

        <Section title="6. 免責事項">
          <p>本アプリが提供する席次情報は、一般的なビジネスマナーをもとにした参考情報です。実際の席順については、利用者ご自身の判断と責任においてご活用ください。本アプリの利用により生じたいかなる損害についても、運営者は責任を負いかねます。</p>
        </Section>

        <Section title="7. プライバシーポリシーの変更">
          <p>本ポリシーは、必要に応じて予告なく変更することがあります。変更後のポリシーは、本ページに掲載した時点から効力を生じるものとします。</p>
        </Section>

        <div className="pt-4 border-t border-stone-200 space-y-2">
          <p className="text-xs text-stone-400 text-center">© 2026 席次メーカー</p>
          <p className="text-xs text-stone-400 text-center">
            <button onClick={() => navigate('/terms')} className="underline hover:text-stone-600">
              利用規約
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-stone-700 border-l-4 border-amber-500 pl-3">{title}</h2>
      <div className="text-sm text-stone-600 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
