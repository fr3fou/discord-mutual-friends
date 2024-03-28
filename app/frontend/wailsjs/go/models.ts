export namespace main {
	
	export class User {
	    id: string;
	    username: string;
	    global_name: string;
	    avatar: string;
	    discriminator: string;
	    public_flags: number;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.global_name = source["global_name"];
	        this.avatar = source["avatar"];
	        this.discriminator = source["discriminator"];
	        this.public_flags = source["public_flags"];
	    }
	}

}

