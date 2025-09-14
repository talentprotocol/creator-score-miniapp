import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Typography as="h1" size="2xl" weight="bold" className="mb-4">
            Dark Mode Theme Preview
          </Typography>
          <Typography size="lg" color="muted" className="mb-8">
            Testing the new Base Blue (#0000FF) theme with dark mode as primary
          </Typography>
        </div>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-brand-base-blue rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-white">
                    Base Blue
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#0000FF</Typography>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-cerulean rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-white">
                    Cerulean
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#3C8AFF</Typography>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-yellow rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-black">
                    Yellow
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#FFD12F</Typography>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-green rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-white">
                    Green
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#66C800</Typography>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-lime-green rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-black">
                    Lime Green
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#B6F569</Typography>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-tan rounded-lg flex items-center justify-center">
                  <Typography weight="bold" className="text-black">
                    Tan
                  </Typography>
                </div>
                <Typography size="sm" color="muted">#B8A581</Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grayscale System */}
        <Card>
          <CardHeader>
            <CardTitle>Grayscale Foundation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[
                { name: "Gray-0", class: "bg-gray-0", text: "text-black" },
                { name: "Gray-10", class: "bg-gray-10", text: "text-black" },
                { name: "Gray-15", class: "bg-gray-15", text: "text-black" },
                { name: "Gray-30", class: "bg-gray-30", text: "text-black" },
                { name: "Gray-50", class: "bg-gray-50", text: "text-white" },
                { name: "Gray-60", class: "bg-gray-60", text: "text-white" },
              ].map((gray) => (
                <div key={gray.name} className="flex items-center gap-4">
                  <div className={`h-8 w-16 ${gray.class} rounded border`}></div>
                  <Typography size="sm" className={gray.text}>
                    {gray.name}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* UI Components */}
        <Card>
          <CardHeader>
            <CardTitle>UI Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Typography size="lg" weight="medium">Buttons</Typography>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="brand-base-blue">Base Blue</Button>
                <Button variant="brand-cerulean">Cerulean</Button>
                <Button variant="brand-yellow">Yellow</Button>
                <Button variant="brand-tan">Tan</Button>
                <Button variant="brand-green">Green</Button>
                <Button variant="brand-lime-green">Lime Green</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div className="space-y-4">
              <Typography size="lg" weight="medium">Badges</Typography>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <Typography size="lg" weight="medium">Semantic States</Typography>
              <div className="flex flex-wrap gap-4">
                <div className="px-3 py-2 bg-success-light text-success rounded-md">
                  Success
                </div>
                <div className="px-3 py-2 bg-warning-light text-warning rounded-md">
                  Warning
                </div>
                <div className="px-3 py-2 bg-error-light text-error rounded-md">
                  Error
                </div>
                <div className="px-3 py-2 bg-info-light text-info rounded-md">
                  Info
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Typography as="h1" size="2xl" weight="bold">Heading 1</Typography>
              <Typography as="h2" size="xl" weight="bold">Heading 2</Typography>
              <Typography as="h3" size="lg" weight="medium">Heading 3</Typography>
              <Typography>Body text with normal weight</Typography>
              <Typography size="sm" color="muted">Small muted text</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Test */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Typography size="sm" color="muted" className="mb-4">
              Testing contrast ratios for WCAG AA compliance
            </Typography>
            <div className="space-y-2">
              <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                <Typography weight="medium">Primary text on primary background</Typography>
              </div>
              <div className="p-4 bg-card text-card-foreground rounded-lg border">
                <Typography weight="medium">Card text on card background</Typography>
              </div>
              <div className="p-4 bg-muted text-muted-foreground rounded-lg">
                <Typography weight="medium">Muted text on muted background</Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}