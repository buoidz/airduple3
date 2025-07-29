import Image from "next/image";

type TableTopNavProps = {
  tableName: string;
};

export function TableTopNav({ tableName }: TableTopNavProps) {
  return (
    <header className="sticky z-10 h-14 bg-blue-600 text-white border-b border-blue-600 top-0 flex items-center px-5">
      <div className="flex items-center gap-4">
        <Image
          src="/logo/airtable-white.png"
          alt="Airtable Logo"
          width={22}
          height={22}
        />
        <h1 className="text-lg font-semibold">{tableName}</h1>
      </div>
    </header>
  );
}
