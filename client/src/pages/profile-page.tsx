import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaymentModal } from "@/components/shared/payment-modal";
import { MainLayout } from "@/components/layouts/main-layout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  User,
  CreditCard,
  History,
  Heart,
  Settings,
  Moon,
  Sun,
  BookOpen,
  Trash2,
  Loader2,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTheme } from "@/components/ui/theme-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Function to notify success
  const notifySuccess = (message: string) => {
    toast({
      title: "Thành công",
      description: message,
    });
  };

  // Function to notify error
  const notifyError = (message: string) => {
    toast({
      title: "Lỗi",
      description: message,
      variant: "destructive",
    });
  };

  // Extract query parameters
  const search = new URLSearchParams(window.location.search);
  const initialTab = search.get("tab") || "profile";

  // State to manage active tab
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/profile?tab=${value}`, { replace: true });
  };

  // Define form schema
  const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    darkMode: z.boolean().default(false),
    displayMode: z.enum(["scroll", "pagination"]).default("scroll"),
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      gender: "male",
      darkMode: theme === "dark",
      displayMode: "scroll",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.setValue("firstName", user.firstName || "");
      form.setValue("lastName", user.lastName || "");
      form.setValue("email", user.email || "");
    }
  }, [user, form]);

  // Update theme when darkMode changes
  useEffect(() => {
    const watchDarkMode = form.watch("darkMode");
    setTheme(watchDarkMode ? "dark" : "light");
  }, [form.watch("darkMode"), setTheme]);

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof formSchema>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", userData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      // Thông báo thành công
      notifySuccess("Thông tin cá nhân đã được cập nhật");
    },
    onError: (error: Error) => {
      // Thông báo lỗi
      notifyError(`Không thể cập nhật thông tin: ${error.message}`);
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProfileMutation.mutate(values);
  }

  // Fetch reading history
  const { data: readingHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["/api/reading-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reading-history");
      return res.json();
    },
  });

  // Fetch favorites
  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favorites");
      return res.json();
    },
  });

  // Fetch payments
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments");
      return res.json();
    },
  });

  // Mutation to remove favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("POST", `/api/favorites/${contentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  // If user is not logged in, redirect to auth page
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <div className="sticky top-24">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="mt-2">{user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-3">
                    <p className="text-sm text-muted-foreground">Số dư:</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(user.balance)}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => (window.location.href = "/payment")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Nạp tiền
                  </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Separator className="my-2" />
                  <div className="w-full">
                    <Tabs
                      value={activeTab}
                      onValueChange={handleTabChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-1 h-auto">
                        <TabsTrigger
                          value="profile"
                          className="flex items-center justify-start py-2 px-3"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Hồ sơ
                        </TabsTrigger>
                        <TabsTrigger
                          value="history"
                          className="flex items-center justify-start py-2 px-3"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Lịch sử đọc
                        </TabsTrigger>
                        <TabsTrigger
                          value="favorites"
                          className="flex items-center justify-start py-2 px-3"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Yêu thích
                        </TabsTrigger>
                        <TabsTrigger
                          value="payments"
                          className="flex items-center justify-start py-2 px-3"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Thanh toán
                        </TabsTrigger>
                        <TabsTrigger
                          value="settings"
                          className="flex items-center justify-start py-2 px-3"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Cài đặt
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <Separator className="my-2" />
                  <Button
                    variant="destructive"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Đăng xuất"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Main content */}
          <div className="md:w-3/4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "profile" && "Thông tin cá nhân"}
                  {activeTab === "history" && "Lịch sử đọc truyện"}
                  {activeTab === "favorites" && "Truyện yêu thích"}
                  {activeTab === "payments" && "Lịch sử thanh toán"}
                  {activeTab === "settings" && "Cài đặt tài khoản"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "profile" &&
                    "Quản lý thông tin cá nhân của bạn"}
                  {activeTab === "history" && "Xem lại những truyện bạn đã đọc"}
                  {activeTab === "favorites" &&
                    "Quản lý danh sách truyện yêu thích"}
                  {activeTab === "payments" &&
                    "Xem lịch sử giao dịch và nạp tiền"}
                  {activeTab === "settings" &&
                    "Tùy chỉnh trải nghiệm đọc truyện"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-0">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Họ</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nhập họ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tên</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nhập tên" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nhập email"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormDescription>
                                Không thể thay đổi email.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Giới tính</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn giới tính" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Nam</SelectItem>
                                  <SelectItem value="female">Nữ</SelectItem>
                                  <SelectItem value="other">Khác</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Lưu thay đổi
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Reading History Tab */}
                  <TabsContent value="history" className="mt-0">
                    {loadingHistory ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : readingHistory && readingHistory.length > 0 ? (
                      <div className="space-y-4">
                        {readingHistory.map((item: any) => (
                          <div
                            key={`${item.content.id}-${item.chapter.id}`}
                            className="flex border-b border-border pb-4"
                          >
                            <div className="w-20 h-24 overflow-hidden rounded-md mr-4">
                              <img
                                src={
                                  item.content.coverImage ||
                                  (item.content.type === "manga"
                                    ? "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80"
                                    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80")
                                }
                                alt={item.content.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">
                                <Link
                                  href={`/${item.content.type}/${item.content.id}`}
                                  className="hover:text-primary"
                                >
                                  {item.content.title}
                                </Link>
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Đã đọc: Chương {item.chapter.number} -{" "}
                                {item.chapter.title ||
                                  `Chương ${item.chapter.number}`}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={`/${item.content.type}/${item.content.id}/chapter/${item.chapter.id}`}
                                  >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Tiếp tục đọc
                                  </Link>
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(item.lastReadAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p>Bạn chưa đọc truyện nào.</p>
                        <Button asChild className="mt-4">
                          <Link href="/">Khám phá truyện</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Favorites Tab */}
                  <TabsContent value="favorites" className="mt-0">
                    {loadingFavorites ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : favorites && favorites.length > 0 ? (
                      <div className="space-y-4">
                        {favorites.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex border-b border-border pb-4"
                          >
                            <div className="w-20 h-24 overflow-hidden rounded-md mr-4">
                              <img
                                src={
                                  item.coverImage ||
                                  (item.type === "manga"
                                    ? "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80"
                                    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80")
                                }
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">
                                <Link
                                  href={`/${item.type}/${item.id}`}
                                  className="hover:text-primary"
                                >
                                  {item.title}
                                </Link>
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.alternativeTitle || item.type === "manga"
                                  ? "Truyện tranh"
                                  : "Truyện chữ"}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/${item.type}/${item.id}`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Đọc truyện
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFavoriteMutation.mutate(item.id)
                                  }
                                  disabled={removeFavoriteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p>Bạn chưa thêm truyện nào vào danh sách yêu thích.</p>
                        <Button asChild className="mt-4">
                          <Link href="/">Khám phá truyện</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Payments Tab */}
                  <TabsContent value="payments" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                          Lịch sử giao dịch
                        </h3>
                        <Button
                          className="w-full"
                          onClick={() => (window.location.href = "/payment")}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Nạp tiền
                        </Button>
                      </div>

                      {loadingPayments ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : payments && payments.length > 0 ? (
                        <div className="space-y-4">
                          {payments.map((payment: any) => (
                            <Card key={payment.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {payment.method === "bank_transfer"
                                        ? "Chuyển khoản ngân hàng"
                                        : payment.method === "credit_card"
                                          ? "Thẻ tín dụng"
                                          : "Ví điện tử"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Mã giao dịch: {payment.transactionId}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className={`text-sm ${
                                        payment.status === "completed"
                                          ? "text-green-600 dark:text-green-400"
                                          : payment.status === "pending"
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-red-600 dark:text-red-400"
                                      }`}
                                    >
                                      {payment.status === "completed"
                                        ? "Thành công"
                                        : payment.status === "pending"
                                          ? "Đang xử lý"
                                          : "Thất bại"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(payment.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p>Bạn chưa có giao dịch nào.</p>
                          <Button
                            className="w-full"
                            onClick={() => (window.location.href = "/payment")}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Nạp tiền
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="mt-0">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="darkMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Chế độ tối
                                </FormLabel>
                                <FormDescription>
                                  Sử dụng chế độ tối để giảm mỏi mắt khi đọc vào
                                  ban đêm.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Sun className="h-4 w-4 text-muted-foreground" />
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Moon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="displayMode"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Kiểu hiển thị truyện tranh</FormLabel>
                              <FormDescription>
                                Chọn cách hiển thị ảnh khi đọc truyện tranh.
                              </FormDescription>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="scroll" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Cuộn dọc (tất cả ảnh hiển thị liên tục)
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="pagination" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Phân trang (hiển thị từng ảnh một)
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit">Lưu cài đặt</Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </MainLayout>
  );
}

// Fix reference error: RadioGroup is not defined
// Since we're using shadcn UI, we need to import it from the components library
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default ProfilePage;
