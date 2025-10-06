import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertPostSchema, type Category } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextEditor from "@/components/rich-text-editor";
import { Plus, Send } from "lucide-react";

const createPostFormSchema = insertPostSchema.extend({
  content: z.string().min(1, "Content is required").superRefine((html, ctx) => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    console.log('Content validation:', { html, text, length: text.length, isValid: text.length >= 10 });
    if (text.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Content must be at least 10 characters long"
      });
    }
  }),
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

interface CreatePostDialogProps {
  children: React.ReactNode;
  categoryId?: string;
}

export default function CreatePostDialog({ children, categoryId }: CreatePostDialogProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated && isOpen,
  });

  // Handle categories error with improved error handling
  useEffect(() => {
    if (categoriesError) {
      console.error('Categories loading error:', categoriesError);
      if (isUnauthorizedError(categoriesError as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error Loading Categories",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [categoriesError, toast]);

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    mode: "onChange", // Simple change validation
    defaultValues: {
      title: "",
      content: "",
      categoryId: categoryId || "",
    },
  });

  // Auto-select first category if none is selected and categories are loaded
  useEffect(() => {
    if (!form.getValues('categoryId') && categories?.length > 0) {
      console.log('Auto-selecting first category:', categories[0]);
      form.setValue('categoryId', categories[0].id, { 
        shouldDirty: true, 
        shouldValidate: true 
      });
    }
  }, [categories, form]);

  // Debug form state changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      // Extract plain text from HTML content for debugging
      const plainTextContent = values.content ? values.content.replace(/<[^>]*>/g, '').trim() : '';
      console.log('Form values changed:', {
        values,
        plainTextContent,
        contentLength: plainTextContent.length,
        isValid: form.formState.isValid,
        errors: form.formState.errors,
        isDirty: form.formState.isDirty,
        touchedFields: form.formState.touchedFields,
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostFormValues) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: (postData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      
      form.reset();
      setIsOpen(false);
      
      toast({
        title: "Post created",
        description: "Your post has been created successfully.",
      });

      // Navigate to the new post
      const id = (postData as any)?.id;
      if (id) {
        setTimeout(() => {
          window.location.href = `/post/${id}`;
        }, 500);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostFormValues) => {
    createPostMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Post
          </DialogTitle>
          <DialogDescription>
            Share your thoughts, ask questions, or start a discussion with the community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!categoryId || categoriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        (categories as any[]).map((category: any) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id}
                            data-testid={`select-item-category-${category.slug}`}
                          >
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Post Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your post title..."
                      {...field}
                      data-testid="input-post-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Post Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <div className="min-h-[200px]">
                      <RichTextEditor
                        content={field.value}
                        onChange={(value) => {
                          console.log('RichTextEditor onChange called with:', { value, length: value?.length });
                          // Direct field update
                          field.onChange(value);
                          // Immediate validation trigger
                          setTimeout(() => {
                            form.trigger();
                          }, 100);
                        }}
                        placeholder="Share your thoughts, ask questions, or provide helpful information..."
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-post"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPostMutation.isPending || !form.formState.isValid}
                data-testid="button-create-post"
                onClick={(e) => {
                  // Debug logging for form validation
                  const formState = {
                    isValid: form.formState.isValid,
                    errors: form.formState.errors,
                    values: form.getValues(),
                    isDirty: form.formState.isDirty,
                    touchedFields: form.formState.touchedFields,
                    dirtyFields: form.formState.dirtyFields,
                    isSubmitting: form.formState.isSubmitting,
                  };
                  console.log('Create Post button clicked - Form state:', formState);
                  
                  // If form is invalid, prevent default and show detailed errors
                  if (!form.formState.isValid) {
                    e.preventDefault();
                    console.log('Form validation failed:', {
                      validationErrors: form.formState.errors,
                      fieldValues: form.getValues(),
                    });
                    
                    // Show user-friendly validation errors
                    Object.entries(form.formState.errors).forEach(([field, error]: [string, any]) => {
                      toast({
                        title: `${field.charAt(0).toUpperCase() + field.slice(1)} Error`,
                        description: error?.message || 'This field is invalid',
                        variant: 'destructive',
                      });
                    });
                  }
                }}
              >
                {createPostMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
