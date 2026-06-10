import { ChevronRight, Heart, ImageIcon, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const items = [
  { id: 1, title: "아이폰 14 Pro 판매합니다", price: 45000, location: "Makati", likes: 24, time: "2시간 전", popular: true },
  { id: 2, title: "소파 팔아요 (거의 새것)", price: 15000, location: "BGC", likes: 18, time: "5시간 전", popular: false },
  { id: 3, title: "한국 라면 대량 판매", price: 2500, location: "Pasay", likes: 42, time: "1일 전", popular: true },
  { id: 4, title: "에어컨 판매 (삼성)", price: 12000, location: "Quezon City", likes: 15, time: "2일 전", popular: false },
];

function Placeholder() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-gray-300" />
    </div>
  );
}

export default function PopularList() {
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">중고거래</h2>
        <button className="flex gap-1 items-center text-teal-500 font-medium text-sm">
          전체보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 모바일: 리스트 */}
      <div className="mt-3 flex flex-col gap-2 md:hidden">
        {items.map((item) => (
          <Card key={item.id} className="flex-row gap-3 p-3">
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
              <Placeholder />
              {item.popular && (
                <span className="absolute top-1 left-1 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  인기
                </span>
              )}
            </div>
            <section className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              <p className="font-bold text-sm">₱{item.price.toLocaleString()}</p>
              <div className="flex justify-between text-xs text-gray-400">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" />
                    <span>{item.likes}</span>
                  </div>
                  <time dateTime="">{item.time}</time>
                </div>
              </div>
            </section>
          </Card>
        ))}
      </div>

      {/* 데스크탑: 그리드 */}
      <div className="mt-4 hidden md:grid grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-0 gap-0">
            <div className="relative aspect-square rounded-t-xl overflow-hidden">
              <Placeholder />
              {item.popular && (
                <span className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  인기
                </span>
              )}
              <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              <p className="font-bold">₱{item.price.toLocaleString()}</p>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
                <time dateTime="">{item.time}</time>
              </div>
              <div className="flex items-center gap-0.5 text-xs text-gray-400">
                <Heart className="w-3 h-3" />
                <span>{item.likes}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
