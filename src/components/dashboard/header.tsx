import { Separator } from "@/components/ui/separator"
import { UserMenu } from "@/components/auth/user-menu"
import { siteConfig } from "@/config/site"

export function DashboardHeader({
    userEmail,
    productName = 'AppHub',
    productLogo
}: {
    userEmail?: string | null
    productName?: string
    productLogo?: string | null
}) {
    return (
        <header className="fixed top-0 left-0 right-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-primary text-primary-foreground z-50">
            <div className="flex items-center gap-2 font-bold text-xl">
                {productLogo ? (
                    <img src={productLogo} alt={productName} className="h-8 w-auto" />
                ) : (
                    <span>{productName}</span>
                )}
            </div>
            <div className="ml-auto flex items-center gap-2">
                <UserMenu email={userEmail} />
            </div>
        </header>
    )
}
