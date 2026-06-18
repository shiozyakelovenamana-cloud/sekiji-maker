import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50"
      style={{ fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic UI',sans-serif" }}>

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

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-stone-800">利用規約</h1>
        <p className="text-xs text-stone-400">最終更新日：2026年6月18日</p>

        <Section title="第1条（本規約の適用）">
          <p>本利用規約（以下「本規約」）は、席次メーカー（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用いただく方（以下「ユーザー」）は、本規約に同意したものとみなします。</p>
        </Section>

        <Section title="第2条（サービスの概要）">
          <p>本サービスは、会議・宴会・接待などのシーンにおける席次表を自動生成するWebアプリケーションです。生成される席次はあくまで一般的なビジネスマナーをもとにした参考情報であり、正解を保証するものではありません。</p>
        </Section>

        <Section title="第3条（利用条件）">
          <p>本サービスは、以下の条件のもとで提供されます。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスは無料でご利用いただけます</li>
            <li>個人・法人を問わず利用可能です</li>
            <li>本規約に同意できない場合は、本サービスのご利用をお控えください</li>
          </ul>
        </Section>

        <Section title="第4条（禁止事項）">
          <p>ユーザーは、以下の行為を行ってはなりません。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスのシステムやプログラムへの不正アクセス・改ざん・リバースエンジニアリング</li>
            <li>本サービスを通じて、違法または公序良俗に反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="第5条（知的財産権）">
          <p>本サービスに関するすべての著作権・商標権その他の知的財産権は、運営者または正当な権利者に帰属します。ユーザーは、本サービスのコンテンツを運営者の許可なく複製・転用・販売することはできません。</p>
        </Section>

        <Section title="第6条（免責事項）">
          <p>運営者は、以下の事項について責任を負いません。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスが提供する席次情報の正確性・完全性</li>
            <li>本サービスの利用により生じたユーザーまたは第三者への損害</li>
            <li>本サービスの停止・中断・変更・終了により生じた損害</li>
            <li>通信環境やデバイスの不具合により生じた損害</li>
          </ul>
          <p>本サービスの生成結果はあくまで参考情報です。最終的な席次の判断はユーザー自身の責任において行ってください。</p>
        </Section>

        <Section title="第7条（広告について）">
          <p>本サービスでは、今後 Google AdSense 等の第三者配信による広告を掲載する場合があります。広告の内容については運営者が管理するものではなく、広告主の責任のもとに提供されます。</p>
        </Section>

        <Section title="第8条（サービスの変更・終了）">
          <p>運営者は、ユーザーへの事前通知なしに本サービスの内容を変更、または提供を停止・終了することができます。これによりユーザーに生じた損害について、運営者は責任を負いません。</p>
        </Section>

        <Section title="第9条（規約の変更）">
          <p>運営者は、必要に応じて本規約を変更することがあります。変更後の規約は本ページに掲載した時点から効力を生じ、引き続き本サービスをご利用いただいた場合は変更に同意したものとみなします。</p>
        </Section>

        <Section title="第10条（準拠法・管轄裁判所）">
          <p>本規約は日本法に準拠するものとし、本サービスに関して生じた紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </Section>

        <div className="pt-4 border-t border-stone-200 space-y-2">
          <p className="text-xs text-stone-400 text-center">© 2026 席次メーカー</p>
          <p className="text-xs text-stone-400 text-center">
            <button onClick={() => navigate('/privacy')} className="underline hover:text-stone-600">
              プライバシーポリシー
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
