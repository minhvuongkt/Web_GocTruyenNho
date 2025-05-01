import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              404 Trang Không Tồn Tại
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Có vẻ bạn đang lạc đường. Trang bạn đang tìm kiếm không tồn tại.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-blue-500 hover:underline"
          >
            Quay lại trang chủ
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
