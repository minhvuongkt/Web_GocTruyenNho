import React from 'react';
import { useAds } from './ads-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface AdSettingsProps {
  className?: string;
}

export function AdsSettings({ className }: AdSettingsProps) {
  const {
    showAds,
    toggleAds,
    showBanners,
    toggleBanners,
    showPopups,
    togglePopups,
    showOverlays,
    toggleOverlays,
    hideAdsOnReading,
    setHideAdsOnReading,
  } = useAds();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cài đặt quảng cáo</CardTitle>
        <CardDescription>
          Tùy chỉnh hiển thị quảng cáo trên trang web
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-ads">Hiển thị quảng cáo</Label>
            <p className="text-sm text-muted-foreground">
              Bật/tắt tất cả quảng cáo trên trang web
            </p>
          </div>
          <Switch
            id="show-ads"
            checked={showAds}
            onCheckedChange={toggleAds}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Loại quảng cáo</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-banners">Banner quảng cáo</Label>
              <p className="text-sm text-muted-foreground">
                Hiển thị ở trên, dưới và hai bên trang
              </p>
            </div>
            <Switch
              id="show-banners"
              checked={showBanners}
              onCheckedChange={toggleBanners}
              disabled={!showAds}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-popups">Popup quảng cáo</Label>
              <p className="text-sm text-muted-foreground">
                Hiển thị trong cửa sổ popup
              </p>
            </div>
            <Switch
              id="show-popups"
              checked={showPopups}
              onCheckedChange={togglePopups}
              disabled={!showAds}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-overlays">Overlay quảng cáo</Label>
              <p className="text-sm text-muted-foreground">
                Hiển thị phủ toàn màn hình
              </p>
            </div>
            <Switch
              id="show-overlays"
              checked={showOverlays}
              onCheckedChange={toggleOverlays}
              disabled={!showAds}
            />
          </div>
        </div>

        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="hide-reading">Ẩn khi đọc truyện</Label>
            <p className="text-sm text-muted-foreground">
              Không hiển thị quảng cáo khi đang đọc truyện
            </p>
          </div>
          <Switch
            id="hide-reading"
            checked={hideAdsOnReading}
            onCheckedChange={setHideAdsOnReading}
            disabled={!showAds}
          />
        </div>
      </CardContent>
    </Card>
  );
}