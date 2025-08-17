export interface Author {
  name: string;
  title: string;
  image: string;
}

export const authors: Record<string, Author> = {
  "Andrew Brown": {
    name: "Andrew Brown",
    title: "Co-founder",
    image: "/images/people/andrew.jpg"
  },
  "Daniel Zellmer": {
    name: "Daniel Zellmer", 
    title: "Co-founder, CTO",
    image: "/images/people/daniel.jpg"
  },
  "Jeff Hantin": {
    name: "Jeff Hantin",
    title: "Trust Protocols Lead",
    image: "/images/people/hantin.jpg"
  }
};