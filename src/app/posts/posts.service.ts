import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { IPost } from './post.model';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

const BECKEND_URL = environment.apiUrl + '/posts/';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private posts: IPost[] = [];
  private postsUpdated = new Subject<{posts: IPost[], postCount:number }>();

  constructor(
    private http: HttpClient,
    private router: Router
    ) { }

  getPosts(postPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postPerPage}&page=${currentPage}`;
    this.http.get<{message:string, posts: any, maxPosts: number}>(BECKEND_URL + queryParams)
      .pipe(map((postData) => {
          return { posts: postData.posts.map((post: any) => {
            return {
              id: post._id,
              title: post.title,
              content: post.content,
              imagePath: post.imagePath,
              creator: post.creator
            };
          }),
          maxPosts: postData.maxPosts
        };
      }))
      .subscribe((transformedPostData) => {
        this.posts = transformedPostData.posts;
        this.postsUpdated.next({
          posts: [...this.posts], 
          postCount:transformedPostData.maxPosts
        });
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<{ _id: string,title:string, content: string, imagePath: string, creator: string }>(BECKEND_URL + id);
  }

  addPost(title: string, content: string, image: File): void {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', title);
    postData.append('image', image, title);
    
    this.http.post<{message:string, post: IPost}>(BECKEND_URL, postData).subscribe((resData) => {
      this.router.navigate(['/']);
    });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let post: IPost | FormData;
    if (typeof(image) === 'object') {
      post = new FormData();
      post.append('id', id);
      post.append('title', title);
      post.append('content', title);
      post.append('image', image, title);
    } else {
      post = { id: id, title:title, content: content, imagePath: image, creator: '' };
    }
    
    this.http.put<IPost>(BECKEND_URL + id, post).subscribe((resData) => {
      this.router.navigate(['/']);
    });
  }

  deletePost(postId: string) {
    return this.http.delete(BECKEND_URL + postId);
  }
}
