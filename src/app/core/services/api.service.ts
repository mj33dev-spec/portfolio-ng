import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent, HttpResponse } from '@angular/common/http';
import { map, tap, filter } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
    providedIn: 'root',
})
export class ApiService {
    token: any;

    constructor(public http: HttpClient) {}

    fileUpload(req: any, param: any): Observable<any> {
        const { route } = param;
        let endURL = route;
        return this.http.post<any>(environment.commonServerURL + endURL, req).pipe(
            map((res) => {
                return res.response || res;
            }),
        );
    }

    fileUploadWithProgress(
        formData: FormData,
        param: any,
        progressSubject: Subject<UploadProgress>
    ): Observable<any> {
        const { route } = param;
        const endURL = route;

        // FormData에서 파일 크기 추정 (정확하지 않을 수 있음)
        let estimatedTotal = 0;
        try {
            const fileInput = formData.getAll('files');
            if (fileInput && fileInput.length > 0) {
                const file = fileInput[0] as File;
                estimatedTotal = file?.size || 0;
            }
        } catch (e) {
            // 파일 크기 추정 실패 시 무시
        }

        return this.http
            .post<any>(environment.commonServerURL + endURL, formData, {
                reportProgress: true,
                observe: 'events',
            })
            .pipe(
                tap((event: HttpEvent<any>) => {
                    if (event.type === HttpEventType.UploadProgress) {
                        // event.total이 없으면 추정값 사용
                        const total = event.total || estimatedTotal || 0;
                        const loaded = event.loaded || 0;
                        const percentage = total > 0 ? Math.round((100 * loaded) / total) : 0;

                        progressSubject.next({
                            loaded,
                            total,
                            percentage,
                        });
                    } else if (event.type === HttpEventType.Response) {
                        // 업로드 완료 시 100%로 설정
                        const total = estimatedTotal || 0;
                        progressSubject.next({
                            loaded: total,
                            total: total,
                            percentage: 100,
                        });
                    }
                }),
                filter((event: HttpEvent<any>) => event.type === HttpEventType.Response),
                map((event: HttpEvent<any>) => {
                    const response = event as HttpResponse<any>;
                    return response.body?.response || response.body || response;
                }),
            );
    }

    /**
     * S3 이미지 Presigned URL 가져오기
     * @param fileKey S3 파일 키
     * @param expiresIn URL 만료 시간 (초, 기본 3600초)
     * @returns Presigned URL
     */
    getPresignedUrl(fileKey: string, expiresIn: number = 3600): Observable<any> {
        const params: Parameter = {
            type: 'GET',
            sendData: {
                fileKey: fileKey,
                expiresIn: expiresIn.toString(),
            },
            route: '/upload/file/url',
        };
        return this.api(params);
    }

    /**
     * S3 이미지 프록시 URL 생성 (서버를 통한 직접 접근)
     * @param fileKey S3 파일 키
     * @returns 프록시 URL 문자열
     */
    getFileProxyUrl(fileKey: string): string {
        return `${environment.commonServerURL}/upload/file?key=${encodeURIComponent(fileKey)}`;
    }

    /**
     * 파일 다운로드 (Blob을 사용하여 CORS 문제 우회 및 강제 다운로드)
     * @param fileKey 파일 경로 (Key)
     * @param fileName 저장할 파일명
     */
    downloadFile(fileKey: string, fileName: string): Observable<void> {
        const url = this.getFileProxyUrl(fileKey);
        return this.http.get(url, { responseType: 'blob' }).pipe(
            map((blob: Blob) => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            })
        );
    }

    api(param: any): any {
        const { type, sendData, route, headers } = param;

        const httpOptions = {
            headers: new HttpHeaders(headers),
        };

        if (type == 'GET') {
            let endURL = route;
            const queryParams = new URLSearchParams(sendData).toString();
            if (queryParams) {
                endURL = `${route}?${queryParams}`;
            }
            return this.http.get<any>(environment.commonServerURL + endURL, httpOptions).pipe(
                map((res) => {
                    return res;
                }),
            );
        }
        if (type == 'POST') {
            return this.http.post<any>(environment.commonServerURL + route, sendData, httpOptions).pipe(
                map((res) => {
                    return res;
                }),
            );
        }
        if (type == 'PATCH') {
            return this.http.patch<any>(environment.commonServerURL + route, sendData, httpOptions).pipe(
                map((res) => {
                    return res;
                }),
            );
        }
        if (type == 'PUT') {
            return this.http.put<any>(environment.commonServerURL + route, sendData, httpOptions).pipe(
                map((res) => {
                    return res;
                }),
            );
        }
        if (type == 'DELETE') {
            let endURL = route;
            const queryParams = new URLSearchParams(sendData).toString();
            if (queryParams) {
                endURL = `${route}?${queryParams}`;
            }
            return this.http.delete<any>(environment.commonServerURL + endURL, httpOptions).pipe(
                map((res) => {
                    return res;
                }),
            );
        }
    }
}

export interface Parameter {
    type?: any;
    sendData?: any;
    route?: any;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

