import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { username: 'asc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, username, email, password, role } = body;

        if (!id || !username || !email) {
            return NextResponse.json({ error: 'ID, username and email are required' }, { status: 400 });
        }

        const updateData: any = {
            username,
            email,
            role
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
    }
}

import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, email, password, role } = body;

        if (!username || !password || !email) {
            return NextResponse.json({ error: 'Username, email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role || 'VIEWER'
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        // Send Email Notification
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Or use host/port from env
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Bienvenido a Perfume Manager - Credenciales de Acceso',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h2 style="color: #333;">Bienvenido a Perfume Manager</h2>
                            <p>Hola <strong>${username}</strong>,</p>
                            <p>Se ha creado una cuenta para ti en el sistema.</p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Usuario:</strong> ${username}</p>
                                <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${password}</p>
                                <p style="margin: 5px 0;"><strong>Rol:</strong> ${role}</p>
                            </div>
                            <p style="color: #666; font-size: 12px;">
                                ⚠️ <strong>Importante:</strong> Este correo contiene información sensible. 
                                Por motivos de seguridad, te recomendamos eliminar este mensaje una vez que hayas guardado tus credenciales.
                                Lamentablemente, el correo no puede auto-eliminarse de tu bandeja de entrada.
                            </p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Ir al Sistema</a>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the request if email fails, just log it
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
