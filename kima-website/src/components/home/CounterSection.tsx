interface Stat {
  label: string
  value: string
  unit: string
}

interface Props {
  stats?: Stat[]
}

const DEFAULT_STATS: Stat[] = [
  { label: '가입 단체', value: '120+', unit: '개' },
  { label: '이주민 대상국', value: '30+', unit: '개국' },
  { label: '활동 회원', value: '500+', unit: '명' },
  { label: '등록 자료', value: '1200+', unit: '건' },
]

function splitValue(value: string) {
  const match = value.match(/^([\d,]+)(.*)$/)
  return {
    number: match?.[1] ?? value,
    suffix: match?.[2] ?? '',
  }
}

export function CounterSection({ stats = DEFAULT_STATS }: Props) {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const { number, suffix } = splitValue(stat.value)

            return (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-[#1B3A6B]">
                  {number}
                  <span className="text-2xl font-semibold text-[#C8922A]">{suffix}</span>
                  <span className="text-xl font-medium text-[#C8922A] ml-1">{stat.unit}</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
