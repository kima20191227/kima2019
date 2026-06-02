import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'KIMA 소개 | 한국이주민선교연합회',
  description: '한국이주민선교연합회(KIMA)는 전국 이주민 사역 단체들이 연합하는 플랫폼입니다.',
}

const SECTIONS = [
  { href: '/about/greeting', icon: '🙏', title: '상임대표 인사말', desc: '남양규 상임대표 인사 및 약력' },
  { href: '/about/history', icon: '📖', title: '설립 배경 & 연혁', desc: '1~3기 역사와 발자취' },
  { href: '/about/vision', icon: '🎯', title: '4기 비전 & 실행계획', desc: '2024년 새로운 도약의 방향' },
  { href: '/about/leadership', icon: '👤', title: '임원단 소개', desc: '전국 위원장·임원진 프로필' },
  { href: '/about/brand', icon: '🎨', title: 'CI 가이드', desc: '로고·색상·폰트 브랜드 자산' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 히어로 */}
      <div className="bg-[#1B3A6B] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-3">About KIMA</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            한국이주민선교연합회
          </h1>
          <p className="mt-4 text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            "연결하고 · 기록하고 · 보이게 하고 · 후원으로 이어주는"<br />
            전국 이주민 사역 연합 플랫폼
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 단체 소개 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-6">단체 소개</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4 text-gray-700 leading-relaxed">
            <p>
              한국이주민선교연합회(KIMA, Korea Immigrants Missions Association)는 한국 내 이주민 사역을 감당하는
              교회, NGO, 법률·복지 기관들이 모인 전국 연합 플랫폼입니다.
            </p>
            <p>
              이주노동자, 유학생, 결혼이민자, 다문화자녀, 난민·미등록 이주민, 귀국이주민 등
              다양한 배경의 이주민들을 섬기는 사역자들이 함께 연결되어, 정보를 나누고
              협력하며 하나님의 선교를 이루어 갑니다.
            </p>
            <p>
              현재 전국 6개 지역, 9개 언어권, 6개 사역대상 카테고리로 구성되어 있으며,
              정기적인 리스닝콜·포럼을 통해 현장의 목소리를 듣고 연대합니다.
            </p>
          </div>
        </section>

        {/* 4대 비전 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-6">4대 사명</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🔗', word: 'CONNECT', desc: '전국 이주민 사역 단체를 하나로 연결합니다' },
              { icon: '📊', word: 'DATA', desc: '이주민 현황과 사역 데이터를 기록·공유합니다' },
              { icon: '📣', word: 'STORY', desc: '현장의 이야기를 세상에 보이게 합니다' },
              { icon: '💛', word: 'FUND', desc: '후원자와 사역을 이어 재정을 흘려보냅니다' },
            ].map((v) => (
              <div key={v.word} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex gap-4 items-start">
                <span className="text-3xl">{v.icon}</span>
                <div>
                  <p className="font-bold text-[#C8922A] text-lg">{v.word}</p>
                  <p className="text-gray-600 text-sm mt-1">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 서브 섹션 링크 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-6">더 알아보기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex gap-4 items-center hover:shadow-md hover:border-[#C8922A] transition-all group"
              >
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#1B3A6B]">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        {/* 정관 전문 */}
        <section>
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-2">정관</h2>
          <p className="text-sm text-gray-500 mb-6">2026. 3. 19. 제3차 개정</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed text-sm">

            {[
              { title: '제1조 【명칭】', body: '본회는 "한국이주민선교연합회"(영문 \'Korea Immigrants Missions Association\', 이하 \'본회\')라고 칭한다.' },
              { title: '제2조 【목적】', body: '\'본회\'는 국내 이주민 선교와 정책구축, 회원 간의 네트워크를 목적으로 한다.' },
              { title: '제3조 【소재】', body: '\'본회\'의 사무실은 수도권에 두고 필요시 지역에 대표부를 둘 수 있다.' },
              {
                title: '제4조 【목적사업】',
                body: '\'본회\'는 목적을 달성하기 위하여 아래의 사업을 한다.',
                items: [
                  '이주민선교의 활성화를 위해 다양성과 일치를 증진',
                  '이주민선교 기본계획 수립',
                  '국내 이주민선교 데이터 구축',
                  '국내 이주민 사회통합 지원망 구축',
                  '이주민선교 훈련교육 및 슈퍼비전 체계 구축',
                  '교단과 교회별 이주민선교사 파송 및 국제협력',
                  '그 밖에 이 단체의 목적에 필요한 사업',
                ],
              },
              {
                title: '제5조 【회원자격】',
                items: [
                  '회원은 \'본회\'의 목적과 정신에 찬동한 3인 이상의 구성원을 가진 단체(교회)로서 공동대표회의 결의로 회원이 된 단체(교회)로 한다.',
                  '\'본회\'의 회원은 제2조의 목적과 설립취지에 찬성하고 소정의 가입절차를 마친 단체(교회)로 한다.',
                  '\'본회\'의 회원이 되고자 하는 단체(교회)는 소정의 회원가입 신청서를 제출하여야 한다.',
                  '\'본회\'의 자격, 가입회비, 월회비 등에 관한 세부사항은 임원회에서 별도의 규정으로 정하고 회원들에게 공지한다.',
                  '\'본회\'의 회원이 되고자 하는 단체(교회)는 복음주의적인 교단 소속증명서를 제출하고, \'본회\' 회원 2명 이상의 추천을 받은 단체로 한다.',
                ],
              },
              { title: '제6조 【의무】', body: '회원은 총회에 참석하고 \'본회\'의 규약 및 결의를 준수할 의무와 회비를 납부할 의무를 갖는다. 3개월 이상 미납시 혹은 2회 이상 총회에 불참시 회원자격은 정지된다.' },
              { title: '제7조 【권리】', body: '회원은 총회에서 선거권, 피선거권, 의결권을 갖는다. 단, 의결권은 소정의 서면 및 전자문서를 통해 위임될 수 있다.' },
              { title: '제8조 【징계】', body: '회원으로 \'본회\'의 명예와 활동에 심각한 피해를 끼친 경우는 공동대표회의 혹은 총회의 결의로 제명, 자격정지, 경고 등의 징계를 할 수 있다.' },
              {
                title: '제9조 【총회】',
                items: [
                  '총회는 \'본회\'의 최고 의결기구로서 출석회원 과반수 동의를 통하여 의결한다. 단, 정관 개정, 임원의 해임 및 단체의 해산은 회원 2/3 출석과 출석회원 2/3 이상의 동의를 통하여 의결한다.',
                  '매년 정기 총회는 1월 중에 한다. 단, 필요시 공동대표회의 의결을 거쳐 총회 일정을 2개월 범위 내에서 연기할 수 있다.',
                  '임시총회는 총회회원 1/3 이상의 동의, 혹은 공동대표 1/3 이상의 동의, 혹은 감사의 소집 요청으로 개최한다.',
                  '총회의 소집은 상임대표가 한다. 단, 상임대표가 적법한 총회소집 요청에 7일 이상 응하지 않을 시 공동대표 가운데 연장자가 총회를 소집하고 진행할 수 있다.',
                  '총회의 결의사항: 공동대표(5인)·감사(2인)·임원 선출 및 해임 / 사업 및 예결산 결의 / 정관의 제정 및 개정 / 본회의 해산 / 기타 총회에서 발의된 안건',
                ],
              },
              {
                title: '제10조 【공동대표회의】',
                body: '공동대표회의는 총회 다음의 최고 의결기구로서 활동 내용과 권한은 다음과 같다.',
                items: [
                  '총회가 위임한 사업의 집행',
                  '신규 회원 가입과 회원 탈퇴 결의',
                  '회원 및 집행부 상벌의 결의',
                  '조직의 구성 및 운영에 필요한 집행부 구성',
                  '각종 규칙의 제정 및 개정',
                  '총회 안건 심의',
                ],
              },
              {
                title: '제11조 【공동대표회의 구성, 운영, 임기】',
                items: [
                  '구성: 공동대표회의는 공동대표, 사무총장으로 구성되며 상임대표는 공동대표회의를 소집하고 주관한다.',
                  '운영: 공동대표회의는 분기별 1회씩 정기 개최되며, 필요시 1주 전에 소집한다.',
                  '공동대표회의는 구성원 과반수 출석과 출석위원 과반수 동의로 의결한다.',
                  '공동대표의 임기는 2년으로 하되 일회에 한하여 연임할 수 있다.',
                  '공동대표회의 구성원이 성범죄나 금고 이상의 형이 확정된 경우 자동으로 직위가 상실된다.',
                  '\'본회\'의 발전과 사업 집행을 위하여 소정의 활동비를 사무총장에게 지급할 수 있다.',
                ],
              },
              {
                title: '제12조 【감사】',
                body: '\'본회\'는 2인의 감사를 두며 임기는 2년으로 한다. 감사의 운영은 다음과 같다.',
                items: [
                  '감사의 범위는 회계, 사업운영에 제한한다.',
                  '총회 2주 전에 감사보고서와 감사의견서를 제출한다.',
                ],
              },
              {
                title: '제13조 【임원의 구성】',
                items: [
                  '공동대표 5인 이상',
                  '사무총장, 사무부총장, 서기, 부서기, 회계, 부회계',
                  '자문위원, 지역별 위원장, 영역별 위원장, 교단 대표, 훈련원장',
                ],
              },
              { title: '제14조 (임원의 선임)', body: '\'본회\'의 공동대표는 공동대표회의에서 추천받은 자 중 참석회원의 과반 동의로 총회에서 선출한다. 공동대표는 이주민사역 5년 이상의 경력과 교단별 균형을 고려하여 추천한다. 상임대표는 공동대표 회의에서 선출하며, 사무총장 등 기타 임원은 공동대표 회의에서 동의를 얻어 상임대표가 임명한다. 임기가 만료된 임원은 임기만료 2개월 이내에 후임자를 선출한다.' },
              {
                title: '제15조 (임원의 해임)',
                body: '임원이 다음 각 호의 어느 하나에 해당하는 행위를 할 때는 총회의 의결을 거쳐 해임할 수 있다.',
                items: [
                  '단체의 목적에 위배되는 행위',
                  '임원간의 분쟁, 회계부정 또는 현저한 부당행위',
                  '단체의 업무를 방해하거나 소홀히 하는 행위',
                  '교회나 사회적으로 비난받을 만한 위법행위를 하는 행위',
                ],
              },
              {
                title: '제16조 (임원의 결격사유)',
                body: '다음 각 호의 어느 하나에 해당하는 자는 임원이 될 수 없다.',
                items: [
                  '금치산자 또는 한정치산자',
                  '파산자로서 복권이 되지 아니한 자',
                  '법원의 판결 또는 다른 것에 의하여 자격이 상실 또는 정지된 자',
                  '금고 이상의 실형의 선고를 받고 그 집행이 종료되거나 면제된 날로부터 3년이 경과하지 아니한 자',
                  '금고 이상의 형의 집행유예선고를 받고 그 유예기간 중에 있는 자',
                  '정당가입 또는 정당후보의 경우 입후보 3개월 전 자진사퇴한다.',
                ],
              },
              { title: '제17조 (임원의 임기)', body: '임원의 임기는 2년으로 하며 연임할 수 있다. 보선에 의하여 취임한 임원의 임기는 전임자의 잔여기간으로 하며, 임기만료 후라도 후임자가 취임할 때까지는 임원으로 직무를 수행한다. 소속교단 규정에 따라 정년이 만료된 임원은 그 잔여기간과 관계없이 임기가 종료된다.' },
              {
                title: '제18조 (임원의 직무)',
                items: [
                  '상임대표는 단체를 대표하여 본회의 업무를 통괄하며, 총회 및 임원회의 의장이 된다.',
                  '사무총장은 모든 행정에 관한 업무를 총괄한다.',
                  '사무부총장은 사무총장의 모든 행정에 관한 업무를 보좌한다.',
                  '서기는 총회·임원회의에 참석하여 회의 내용을 기록·정리하고, 부서기는 서기를 보좌한다.',
                  '회계는 회원의 회비·지출·관리를 보고하고, 부회계는 회계를 보좌한다.',
                ],
              },
              {
                title: '제19조 (임원회의 소집)',
                items: [
                  '임원회의는 정기회의와 임시회의로 구분한다.',
                  '정기회의는 매월 1회 진행하며, 임시회의는 상임대표가 필요하다고 인정할 때 또는 임원의 1/3 이상 요청 시 소집한다.',
                  '소집 시 회의 개최 7일 전까지 안건·일시·장소를 명기하여 통지하여야 한다.',
                ],
              },
              {
                title: '제20조 (임원회의 의결사항)',
                items: [
                  '업무집행에 관한 사항',
                  '사업계획의 운영에 관한 사항',
                  '예산·결산서의 작성에 관한 사항',
                  '정관변경에 관한 사항',
                  '재산관리에 관한 사항',
                  '총회에 부의할 안건의 작성',
                  '총회에서 위임받은 사항',
                  '기타 상임대표가 중요하다고 부의하는 사항',
                ],
              },
              { title: '제21조 (임원회의 의결 정족수)', body: '임원회는 임원의 출석으로 개의하고 출석임원 과반수의 찬성으로 의결한다. 가부 동수인 경우에는 상임대표가 결정한다.' },
              { title: '제22조 (임원회의 서면결의)', body: '상임대표는 임원회에 부의할 사항 중 경미하거나 긴급한 사항에 관하여 서면으로 의결할 수 있다. 이 경우 결과를 차기 임원회에 보고하여야 한다. 재적임원 과반수가 임원회에 부의할 것을 요구하는 때에는 상임대표는 이에 따라야 한다.' },
              { title: '제23조 【고문 및 자문】', body: '\'본회\'에 공로가 있거나 선교적 공헌이 있는 자를 고문이나 자문으로 추대할 수 있다. 고문은 총회의 추대를 받은 원로 사역자이며, 자문은 상임대표나 공동대표로 활동한 자로서 총회의 추대를 받은 자로 한다.' },
              { title: '제24조 (지역대표자)', body: '\'본회\'는 목적과 사업추진을 위해 전국 주요 거점에 지역 위원장을 둘 수 있다. 지역 위원장은 임원회에서 추천하고 임원회의 의결을 거쳐 상임대표가 임명한다.' },
              { title: '제25조 【재산】', body: '\'본회\'의 수입은 일반후원, 회원회비, 특별모금, 사업수익으로 하며 매년 수입·지출 내역을 공개한다. \'본회\' 해산시 목적이 같은 단체나 기관에 잔여 재산을 기부한다.' },
              { title: '제26조 【회계연도】', body: '\'본회\'의 회계연도는 매년 1월 1일부터 12월 31일까지로 한다.' },
            ].map((article) => (
              <div key={article.title} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-[#1B3A6B] mb-1">{article.title}</p>
                {article.body && <p className="text-gray-700">{article.body}</p>}
                {article.items && (
                  <ol className="mt-1.5 space-y-1 list-decimal list-inside text-gray-700">
                    {article.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}

            {/* 부칙 */}
            <div className="pt-4 border-t-2 border-[#1B3A6B]/20">
              <p className="font-bold text-[#1B3A6B] mb-4">부 칙</p>
              <div className="space-y-4">
                {[
                  { title: '제1조 【준칙】', body: '이 회칙에 명시되지 않은 사항은 민주주의 일반원칙과 공동대표회의 유권해석에 의한다.' },
                  { title: '제2조 【효력발생】', body: '이 회칙은 총회에서 통과되는 즉시 효력을 발생한다.' },
                  { title: '제3조 【경과조치】', body: '\'본회\' 설립당시 총회에서 선임된 임원은 이 정관에 의해 선임된 것으로 본다.' },
                  { title: '제4조', body: '본회의 목적을 달성하기 위해 훈련원을 둘 수 있다.' },
                ].map((a) => (
                  <div key={a.title} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-[#1B3A6B] mb-1">{a.title}</p>
                    <p className="text-gray-700">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 개정 이력 */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
              <p>· 2019. 12. 27. 제정</p>
              <p>· 2022.  1. 20. 제1차 변경</p>
              <p>· 2024.  3. 19. 제2차 변경</p>
              <p>· 2026.  3. 19. 제3차 변경</p>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
