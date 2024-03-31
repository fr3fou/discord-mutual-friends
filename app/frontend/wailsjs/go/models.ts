export namespace main {
	
	export interface User {
	    id: string;
	    username: string;
	    global_name: string;
	    avatar: string;
	    discriminator: string;
	    public_flags: number;
	    friends?: Friend[];
	}
	export interface Friend {
	    id: string;
	    type: number;
	    user: User;
	}

}

