import { Head } from "@inertiajs/react";
import { Card, Input, Typography } from "@material-tailwind/react";

export default function Login() {
    return (
        <>
            <Head title="Masuk" />
            <div className="min-h-screen w-full bg-white relative">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `
        linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
        radial-gradient(circle 500px at 20% 100%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 500px at 100% 80%, rgba(59,130,246,0.3), transparent)
      `,
                        backgroundSize:
                            "48px 48px, 48px 48px, 100% 100%, 100% 100%",
                    }}
                />
                <div className="min-h-screen max-w-sm w-full mx-auto flex justify-center items-center">
                    <Card>
                        <Card.Body>
                            <form>
                                <div className="flex flex-col gap-4">
                                    <div className="w-full">
                                        <Typography
                                            type="small"
                                            as="label"
                                            className="font-semibold"
                                            htmlFor="form-email"
                                        >
                                            Email
                                        </Typography>
                                        <Input
                                            id="form-email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </>
    );
}
