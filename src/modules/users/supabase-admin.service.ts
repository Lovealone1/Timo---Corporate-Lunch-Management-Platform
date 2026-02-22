import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAdminService implements OnModuleInit {
    private readonly logger = new Logger(SupabaseAdminService.name);
    private client!: SupabaseClient;

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        const url = this.config.getOrThrow<string>('SUPABASE_URL');
        const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

        this.client = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        this.logger.log('Supabase admin client initialised');
    }

    async createAuthUser(
        email: string,
        password: string,
    ): Promise<{ id: string; email: string }> {
        const { data, error } = await this.client.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) throw error;

        return { id: data.user.id, email: data.user.email! };
    }

    async deleteAuthUser(userId: string): Promise<void> {
        const { error } = await this.client.auth.admin.deleteUser(userId);
        if (error) {
            this.logger.error(
                `Rollback: failed to delete Supabase auth user ${userId}`,
                error.message,
            );
        }
    }
}
