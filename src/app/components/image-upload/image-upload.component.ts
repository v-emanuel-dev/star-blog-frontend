import { HttpClient } from '@angular/common/http';

export class ImageUpload {
  private loader: any;

  constructor(loader: any, private http: HttpClient) {
    this.loader = loader;
  }

  upload(): Promise<any> {
    return this.loader.file
      .then((file: File) => this.uploadFile(file));
  }

  private uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('profilePicture', file); // O campo que o multer espera

    return this.http.post<{ url: string }>('/api/upload', formData) // Altere para o endpoint correto
      .toPromise()
      .then((response) => {
        if (response && response.url) {
          return {
            default: response.url, // A URL da imagem no seu servidor
          };
        } else {
          return Promise.reject('Upload failed: No URL returned');
        }
      })
      .catch((error) => {
        console.error('Upload failed:', error);
        return Promise.reject(error);
      });
  }
}
