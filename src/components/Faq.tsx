import React, { useState } from 'react';

const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'この席次表は絶対に正しいですか？',
    a: '一般的なビジネスマナーをベースにしたひとつの目安です。会社の文化や業界、会議・会食の目的によって正解は変わるので、最終的には実際の状況に合わせて調整してもらえると安心です。',
  },
  {
    q: '上座・下座はどうやって決めていますか？',
    a: '出入口から遠い席、正面（ステージや床の間など）に近い席ほど上座として点数をつけて判定しています。レイアウト（テーブル・円卓・コの字など）によって判定の重みが変わります。',
  },
  {
    q: '社内の人と社外のお客様、どちらが上座になりますか？',
    a: 'お客様が優先され、上座側に配置されます。自社の参加者は基本的に下座側になります。',
  },
  {
    q: '同じ役職の人が複数いる場合はどうなりますか？',
    a: '同役職の中ではスコアの高い順に席が割り振られますが、誰が一番上座になるかまでは指定できません。役職内の細かい順位までこだわりたい場合は、カスタムモードで名前を直接ランク順に入力するのがおすすめです。',
  },
  {
    q: '会議室の形によって席次は変わりますか？',
    a: '変わります。テーブル席・ロの字・コの字・円卓など、レイアウトごとに上座・下座の考え方そのものが異なるので、それぞれに合わせた配置にしています。',
  },
  {
    q: 'タイムキーパーや議事録担当はどんな基準で配置されますか？',
    a: '役職の偉さよりも進行のしやすさを優先しています。議長と同じ辺の、議長に次いでスコアの高い席に配置されるイメージです。',
  },
  {
    q: '司会・進行役は上座になりますか？',
    a: '必ずしも上座にはなりません。本アプリでは進行しやすい位置（議長の近く）を優先しているため、結果として上座寄りになることが多いですが、役職の格による配置ではありません。',
  },
  {
    q: '出入口が複数ある場合はどうなりますか？',
    a: '本ツールでは出入口は1方向のみの設定となっています。実際の会議室に複数の出入口がある場合は、最も主に使われる出入口を基準に設定して、結果を参考程度にご活用ください。',
  },
  {
    q: 'オンライン会議でも使えますか？',
    a: 'このツールは対面での着席を想定しているため、オンライン会議の画面表示順などには対応していません。',
  },
  {
    q: '会食や懇親会でも使えますか？',
    a: '使えます。宴会モードでは出入口・正面（ステージ）の有無を選べるほか、幹事の配置にも対応しています。ただしお店の構造や主催者の意向で実際の席順が変わることもあるので、あくまで目安としてご利用ください。',
  },
  {
    q: '自社のルールと違う結果になりました。',
    a: '会社や業界ごとの慣習が優先されるべき場面があります。本ツールの結果はあくまで一般的な参考情報なので、違いがあれば実情に合わせて調整してください。',
  },
  {
    q: '料金はかかりますか？',
    a: '無料でご利用いただけます。',
  },
  {
    q: '入力した名前や情報は保存されますか？',
    a: '入力内容はお使いの端末のブラウザ内に保存され、外部のサーバーへ送信されることはありません。ブラウザのデータを削除すると入力内容も消えます。',
  },
  {
    q: '席次表がうまく生成されません。',
    a: (
      <>
        まずは入力した人数の合計と、選んだレイアウトの席数が合っているかご確認ください。それでも解決しない場合やおかしな表示が出る場合は、お手数ですが下記までご連絡いただけると助かります。
        <br />
        <a href="mailto:bonitotsukudani@gmail.com" className="text-amber-600 underline">
          bonitotsukudani@gmail.com
        </a>
      </>
    ),
  },
];

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100 last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left gap-3"
      >
        <span className="text-sm font-medium text-stone-700">{q}</span>
        <span className={`text-stone-400 text-sm flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <p className="text-xs text-stone-500 leading-relaxed pb-3 pr-6">{a}</p>
      )}
    </div>
  );
}

export function FaqContent() {
  return (
    <>
      {FAQ_ITEMS.map((item, i) => (
        <FaqItem key={i} q={item.q} a={item.a} />
      ))}
    </>
  );
}

export function Faq() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-2 mt-4">
      <div className="text-sm font-bold text-stone-700 pt-2 pb-1">よくある質問</div>
      <FaqContent />
    </div>
  );
}
