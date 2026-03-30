type PlatformRulesRow = {
  element: string
  rule: string
}

type PlatformRulesTableProps = {
  brandColor: string
  rows: PlatformRulesRow[]
}

export function PlatformRulesTable({ brandColor, rows }: PlatformRulesTableProps) {
  return (
    <div
      className="overflow-hidden rounded-3xl border bg-[#212631]"
      style={{ borderColor: brandColor }}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#101417] text-[12px] font-medium text-[#4E576A]">
            <th className="px-4 py-3">Elemento</th>
            <th className="px-4 py-3">Regla</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.element}
              className={index % 2 === 0 ? 'bg-[#212631]' : 'bg-[#1A1F28]'}
            >
              <td className="w-[32%] px-4 py-3 align-top font-medium text-[#E0E5EB]">
                {row.element}
              </td>
              <td className="px-4 py-3 text-[#C5CBD6]">{row.rule}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
