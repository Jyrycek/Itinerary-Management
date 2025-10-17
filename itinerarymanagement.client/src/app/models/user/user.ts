export class User {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;

  constructor(username: string, password: string, firstName: string, lastName: string, email: string, profileImageUrl?: string) {
    this.username = username;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.profileImageUrl = profileImageUrl;
  }
}

export class UserJson {
  username = '';
  firstName = '';
  lastName = '';
  email = '';
  role = '';
  createdAt: Date = new Date();
  profileImageUrl = '';
}

