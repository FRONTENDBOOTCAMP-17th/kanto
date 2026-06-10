import PopularList from "./PopularList";

export default function Popular() {
  return (
    <>
      <div className="mt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 md:mb-10">인기 목록</h1>
      </div>
      <PopularList />
    </>
  );
}
