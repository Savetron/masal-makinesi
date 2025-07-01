import { describe, it, expect } from 'vitest'
import { validateUserRequest, validateStoryResponse, quickValidateJSON } from '@masal-makinesi/prompts'
import type { ValidationError } from '@masal-makinesi/shared'
import { StoryTheme, StoryLength } from '@masal-makinesi/shared'

describe('Validation', () => {
    describe('validateUserRequest', () => {
        it('should validate correct user request', () => {
            const validRequest = {
                childName: 'Ahmet',
                age: 7,
                theme: StoryTheme.ADVENTURE,
                length: StoryLength.SHORT,
                elements: ['forest', 'princess'],
                token: 'valid-jwt-token'
            }
            
            const result = validateUserRequest(validRequest)
            expect(result.valid).toBe(true)
            expect(result.errors).toEqual([])
        })

        it('should reject invalid child name', () => {
            const invalidRequest = {
                childName: '',
                age: 7,
                theme: StoryTheme.ADVENTURE,
                length: StoryLength.SHORT,
                token: 'valid-jwt-token'
            }
            
            const result = validateUserRequest(invalidRequest)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e: ValidationError) => e.field === 'childName')).toBe(true)
        })

        it('should reject invalid age', () => {
            const invalidRequest = {
                childName: 'Ahmet',
                age: 25, // Too old
                theme: StoryTheme.ADVENTURE,
                length: StoryLength.SHORT,
                token: 'valid-jwt-token'
            }
            
            const result = validateUserRequest(invalidRequest)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e: ValidationError) => e.field === 'age')).toBe(true)
        })

        it('should reject missing required fields', () => {
            const incompleteRequest = {
                childName: 'Ahmet',
                // Missing age, theme, length, token
            }
            
            const result = validateUserRequest(incompleteRequest)
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should validate optional elements array', () => {
            const requestWithElements = {
                childName: 'Ahmet',
                age: 7,
                theme: StoryTheme.ADVENTURE,
                length: StoryLength.SHORT,
                elements: ['dragon', 'castle', 'magic'],
                token: 'valid-jwt-token'
            }
            
            const result = validateUserRequest(requestWithElements)
            expect(result.valid).toBe(true)
        })

        it('should reject invalid theme', () => {
            const requestWithInvalidTheme = {
                childName: 'Ahmet',
                age: 7,
                theme: 'invalid-theme',
                length: StoryLength.SHORT,
                token: 'valid-jwt-token'
            }
            
            const result = validateUserRequest(requestWithInvalidTheme)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e: ValidationError) => e.field === 'theme')).toBe(true)
        })
    })

    describe('validateStoryResponse', () => {
        it('should validate well-structured story response', () => {
            const validStoryJSON = JSON.stringify({
                title: 'Ahmet ve Renkli Orman',
                content: `Bir varmış bir yokmuş, Ahmet adında cesur bir çocuk varmış. Bir gün ormanda gezerken renkli bir kapı keşfetmiş. 
                Bu kapıyı açtığında karşısına muhteşem güzel bir dünya çıkmış ve orada konuşan hayvanlarla tanışmış. 
                "Merhaba Ahmet!" demiş sevimli bir tavşan ona. "Burada çok güzel maceralar yaşayabilirsin" diye eklemiş.
                Ahmet hayvanlarla dostluk kurmuş ve onlarla birlikte ormanda gezmiş. Renkli çiçekler toplamış ve güzel kelebeklerle dans etmiş.
                Akşam olduğunda eve dönme zamanı gelmiş. Hayvan dostları ona veda etmiş ve "Her zaman burada olacağız" demişler.
                Ahmet eve döndüğünde ailesine bu muhteşem macerasını anlatmış. Annesi ve babası çok şaşırmış ve gurur duymuşlar.
                O geceden sonra Ahmet her gün güzel ormanı düşünmüş ve yeni maceralar hayal etmiş. Sonunda mutlu mesut yaşamışlar.`,
                wordCount: 115,
                theme: StoryTheme.ADVENTURE,
                language: 'tr'
            })
            
            const result = validateStoryResponse(validStoryJSON, StoryLength.SHORT)
            expect(result.valid).toBe(true)
            expect(result.errors).toEqual([])
        })

        it('should reject invalid story structure', () => {
            const invalidStoryJSON = JSON.stringify({
                // Missing required fields
                title: 'Test'
            })
            
            const result = validateStoryResponse(invalidStoryJSON, StoryLength.SHORT)
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should validate word count against expected length', () => {
            const shortStoryJSON = JSON.stringify({
                title: 'Kısa Hikaye',
                content: 'Çok kısa bir hikaye. Bu yeterli değil. Son cümle.',
                wordCount: 10,
                theme: StoryTheme.FANTASY,
                language: 'tr'
            })
            
            const result = validateStoryResponse(shortStoryJSON, StoryLength.SHORT)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e: ValidationError) => e.field === 'wordCount')).toBe(true)
        })

        it('should check content safety', () => {
            const unsafeStoryJSON = JSON.stringify({
                title: 'Tehlikeli Hikaye',
                content: `Bu hikayede şiddet ve korku var buradadır. Çok kötü şeyler oluyor sürekli ve herkes korkuyor her zaman. 
                Şiddet dolu sahneler devam ediyor ve çocuklar için hiç uygun değil bu hikaye kesinlikle.
                Korkunç olaylar yaşanıyor sürekli ve kimse mutlu değil bu durumda hiç.
                Bu tür içerikler çocuklar için çok zararlı olabilir ve onların kabus görmelerine neden olabilir kesinlikle.
                Hikayede sürekli kötü karakterler var ve onlar hep zarar veriyorlar diğer karakterlere.
                Sonunda hiç kimse mutlu olamaz ve herkes üzgün kalır bu hikayede maalesef böyle.`,
                wordCount: 85,
                theme: StoryTheme.ADVENTURE,
                language: 'tr'
            })
            
            const result = validateStoryResponse(unsafeStoryJSON, StoryLength.SHORT)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e: ValidationError) => e.field === 'content')).toBe(true)
        })
    })

    describe('quickValidateJSON', () => {
        it('should validate correct JSON', () => {
            const validJSON = JSON.stringify({
                title: 'Test Hikayesi',
                content: `Bu güzel bir test hikayesidir ve çok eğlencelidir. İçerikte yeterli kelime bulunmaktadır ve hikaye formatındadır.
                Karakterler çok mutludur ve sürekli güzel maceralar yaşarlar birlikte ormanlarında.
                Hikayede çok güzel diyaloglar vardır ve karakterler birbirleriyle konuşurlar sürekli.
                "Merhaba" derler birbirlerine ve "Nasılsın?" diye sorarlar mutlu bir şekilde.
                Sonunda herkes çok mutlu olur ve güzel günler geçirirler hep birlikte bu hikayede.
                Bu şekilde hikaye devam eder ve son bulur mutlu bir şekilde tamamıyla.`,
                wordCount: 95,
                theme: StoryTheme.FANTASY,
                language: 'tr'
            })
            
            const result = quickValidateJSON(validJSON)
            expect(result.valid).toBe(true)
            expect(result.data).toBeDefined()
        })

        it('should reject invalid JSON', () => {
            const invalidJSON = '{ invalid json format'
            
            const result = quickValidateJSON(invalidJSON)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
        })

        it('should handle empty string', () => {
            const result = quickValidateJSON('')
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
        })

        it('should validate basic story structure', () => {
            const basicStoryJSON = JSON.stringify({
                title: 'Basit Hikaye Anlatısı',
                content: `Güzel bir hikaye anlatacağım size dostlarım çünkü bu çok önemlidir. 
                Bu hikaye gerçekten çok güzeldir ve oldukça eğlencelidir okumak için.
                Karakterler çok mutlu yaşarlar ve macera dolu günler geçirirler birlikte sürekli.
                "Hadi gel!" derler birbirlerine ve beraber oynarlar bahçede her gün.
                Onlar çok iyi arkadaştırlar ve hiç ayrılmazlar birbirlerinden asla.
                Bu şekilde hikaye son bulur ve herkes mutlu olur sonunda.`,
                wordCount: 85,
                theme: StoryTheme.FRIENDSHIP,
                language: 'tr'
            })
            
            const result = quickValidateJSON(basicStoryJSON)
            expect(result.valid).toBe(true)
            expect(result.data.title).toBe('Basit Hikaye Anlatısı')
            expect(result.data.content).toContain('Güzel bir hikaye')
        })
    })
}) 