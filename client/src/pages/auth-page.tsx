import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, registerSchema } from "@shared/schema";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BookOpen, User, Mail, KeyRound, EyeIcon, EyeOffIcon } from "lucide-react";

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Setup login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Setup register form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: { username: string; password: string }) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row lg:gap-12 max-w-6xl mx-auto">
          {/* Form column */}
          <div className="flex-1 mb-8 lg:mb-0">
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Đăng nhập</CardTitle>
                    <CardDescription>
                      Đăng nhập để truy cập vào tài khoản của bạn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form 
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên đăng nhập</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    placeholder="Nhập tên đăng nhập" 
                                    className="pl-9" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Nhập mật khẩu"
                                    className="pl-9 pr-9"
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={togglePasswordVisibility}
                                  >
                                    {showPassword ? (
                                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Chưa có tài khoản?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setActiveTab("register")}
                      >
                        Đăng ký ngay
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Đăng ký</CardTitle>
                    <CardDescription>
                      Tạo tài khoản mới để truy cập đầy đủ các tính năng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form 
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Họ</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Nhập họ" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tên</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Nhập tên" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên đăng nhập</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    placeholder="Nhập tên đăng nhập" 
                                    className="pl-9" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="email" 
                                    placeholder="Nhập email" 
                                    className="pl-9" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Nhập mật khẩu" 
                                    className="pl-9 pr-9" 
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={togglePasswordVisibility}
                                  >
                                    {showPassword ? (
                                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Xác nhận mật khẩu</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="Nhập lại mật khẩu" 
                                    className="pl-9 pr-9" 
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={toggleConfirmPasswordVisibility}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Đã có tài khoản?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setActiveTab("login")}
                      >
                        Đăng nhập
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Hero content column */}
          <div className="flex-1">
            <div className="flex flex-col h-full justify-center">
              <BookOpen className="w-16 h-16 text-primary mb-5" />
              <h1 className="text-4xl font-bold mb-3">GocTruyenNho</h1>
              <p className="text-xl mb-6">
                Nền tảng đọc truyện tranh và truyện chữ hàng đầu Việt Nam
              </p>
              <div className="space-y-4 text-muted-foreground">
                <div className="flex items-start">
                  <div className="mr-2 mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <p>Hàng ngàn truyện tranh và truyện chữ hấp dẫn</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-2 mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <p>Cập nhật liên tục các truyện mới nhất</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-2 mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <p>Giao diện thân thiện, dễ sử dụng trên mọi thiết bị</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-2 mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <p>Trải nghiệm đọc truyện tối ưu với nhiều tùy chỉnh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default AuthPage;
