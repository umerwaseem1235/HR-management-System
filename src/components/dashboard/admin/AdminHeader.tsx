'use client';

interface AdminHeaderProps {
  welcomeName: string;
  todayLabel: string;
}

export default function AdminHeader({ welcomeName, todayLabel }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-[#17324D]">
          Welcome back, {welcomeName}!
        </h1>
      </div>
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D6E4E8]/70 bg-white px-4 py-2 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)]">
        <span className="text-[13px] font-semibold text-[#17324D]">{todayLabel}</span>
      </div>
    </div>
  );
}
