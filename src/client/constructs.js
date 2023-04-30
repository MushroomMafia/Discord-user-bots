/**
 *
 *  ## OVERVIEW
 *
 *  Specifies function option objects
 *  Specifies general classes that parse data into a packet object.
 *
 *  ## WHEN CONTRIBUTING:
 *
 *  Make sure variable names are capitalized.
 *  Options have the "Opts" suffix.
 *
 */

const FS = require("node:fs");
const Path = require("node:path");
const FormData = require("form-data");

const MentionsLimiterOpts = {
    allowUsers: true,
    allowRoles: true,
    allowEveryone: true,
    allowRepliedUser: true,
};
class MentionsLimiter {
    /**
     * Mentions object when dealing with messages
     * @param {MentionsLimiterOpts} opts Defaults/options
     */
    constructor(opts = MentionsLimiterOpts) {
        const options = {
            ...MentionsLimiterOpts,
            ...opts,
        };
        this.parse = [];
        this.replied_user = options.allowRepliedUser;

        if (options.allowUsers) this.parse.push("users");
        if (options.allowRoles) this.parse.push("roles");
        if (options.allowEveryone) this.parse.push("everyone");
    }
}

const CustomStatusOpts = {
    text: null,
    emoji: null,
    expireAt: null,
};
class CustomStatus {
    /**
     * Custom status object and logic
     * @param {CustomStatusOpts} opts Defaults/options
     */
    constructor(opts = CustomStatusOpts) {
        const options = {
            ...CustomStatusOpts,
            ...opts,
        };
        this.contents = {
            expires_at: options.expireAt,
            text: options.text,
            emoji_name: options.emoji,
        };

        for (const key in this.contents) {
            if (this.contents[key] === null) {
                delete this.contents[key];
            }
        }
        if (Object.keys(this.contents).length === 0) this.contents = null;
    }
}

const SendMessageOpts = {
    content: "",
    reply: null,
    tts: false,
    embeds: [],
    allowed_mentions: MentionsLimiterOpts,
    components: null,
    stickers: [],
    attachments: [],
};
class SendMessage {
    /**
     * Message send class for sending messages
     * @param {SendMessageOpts} opts Defaults/options
     */
    constructor(opts = SendMessageOpts) {
        const options = {
            ...SendMessageOpts,
            ...opts,
        };

        const formData = new FormData();

        const attachments = [];
        if (Array.isArray(options.attachments) && options.attachments.length > 0) {
            this.isMultipartFormData = true;

            options.attachments.forEach((item, index) => {
                if (!item) return;

                switch (typeof item) {
                    case "string": {
                        item = {
                            path: item,
                        };
                    }

                    case "object": {
                        if (!item.path) return;

                        const filename = item.name || Path.basename(item.path) || `file-${index}`;
                        formData.append(`files[${index}]`, FS.createReadStream(item.path), filename);
                        attachments.push({
                            id: index,
                            filename,
                            description: item.description || filename,
                        });
                        break;
                    }
                }
            });

            options.attachments = attachments;
        }

        this.content = {
            content: options.content,
            tts: options.tts,
            embeds: options.embeds,
            allowed_mentions: new MentionsLimiter(options.allowed_mentions),
            message_reference:
                options.reply !== null
                    ? {
                          message_id: options.reply,
                      }
                    : null,
            components: null,
            sticker_ids: options.stickers,
            ...(attachments.length > 0 ? { attachments } : {}),
        };

        if (this.isMultipartFormData) {
            formData.append("payload_json", this.content);
            this.content = formData;
        }
    }
}

/*
{"type":2,
"application_id":"936929561302675456", 
"guild_id":"1088993371290349592", 
"channel_id":"1088993785691787467", 
"session_id":"d04fe8eb123222984df98f54c665e349",
"data":{
    "version":"987795925764280356", //??
    "id":"972289487818334209", // Info command ID
    "name":"info",
    "type":1,
    "options":[],
    "application_command":{
        "id":"972289487818334209", // Info command ID
        "application_id":"936929561302675456", // application ID
        "version":"987795925764280356", //??
        "default_member_permissions":null,
        "type":1,
        "nsfw":false,
        "name":"info", // Name of the command
        "description":"View information about your profile.",
        "dm_permission":true,
        "contexts":null
    },
    "attachments":[]
},
"nonce":"1102105238573154304"}
*/

const SendInteractionOpts = {
    type: 2,
    application_id: "936929561302675456", // Mid Journey? //TODO get this from the "typing" resp
    guild_id: "1088993371290349592", // Server ID
    channel_id: "1088993785691787467", // Text Channel ID
    session_id: "",
    data: {
        version: "987795925764280356", //??
        id: "972289487818334209", // Info command ID
        name: "info",
        type: 1,
        options: [],
        application_command: {
            id: "972289487818334209", // Info command ID
            application_id: "936929561302675456", // application ID
            version: "987795925764280356", //??
            default_member_permissions: null,
            type: 1,
            nsfw: false,
            name: "info", // Name of the command
            description: "View information about your profile.",
            dm_permission: true,
            contexts: null
        },
        attachments: []
    },
    nonce: "1102105238573154304"
};
class SendInteraction {
    /**
     * Message send class for sending messages
     * @param {SendMessageOpts} opts Defaults/options
     */
    constructor(opts = SendMessageOpts, session_id) {
        const options = {
            ...SendMessageOpts,
            ...opts,
        };

        options.session_id = session_id;
    }
}

module.exports = {
    FetchRequestOpts: {
        method: "GET",
        body: null,
    },
    CreateInviteOpts: {
        validate: null,
        max_age: 0,
        max_uses: 0,
        target_user_id: null,
        target_type: null,
        temporary: false,
    },
    BotConfigOpts: {
        api: "v9",
        wsurl: "wss://gateway.discord.gg/?encoding=json&v=9",
        url: "https://discord.com",
        typinginterval: 1000,
        proxy: undefined,
        autoReconnect: true,
    },
    MentionsLimiterOpts,
    CustomStatusOpts,
    SendMessageOpts,
    SendInteractionOpts,
    MentionsLimiter,
    CustomStatus,
    SendMessage,
    SendInteraction,
};
